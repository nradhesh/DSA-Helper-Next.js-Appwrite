import { answerCollection, db, questionCollection, voteCollection } from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/auth";
import { NextRequest , NextResponse } from "next/server";
import { ID , Query } from "node-appwrite";

export async function POST(req: NextRequest){
    try {
        // get data
        const { votedById, voteStatus, type, typeId } = await req.json();

        const existingVotes = await databases.listDocuments(db, voteCollection, [
            Query.equal("type", type),
            Query.equal("typeId", typeId),
            Query.equal("votedById", votedById)
        ]);

        // If a vote exists, remove it and adjust reputation accordingly
        if (existingVotes.documents.length > 0) {
            const existingVote = existingVotes.documents[0];
            await databases.deleteDocument(db, voteCollection, existingVote.$id);

            const questionOrAnswer = await databases.getDocument(db, type === "question" ? questionCollection : answerCollection, typeId);
            const authorPrefs = await users.getPrefs<UserPrefs>(questionOrAnswer.authorId);

            const reputationAdjustment = existingVote.voteStatus === "upvoted" ? -1 : 1;
            await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
                reputation: Number(authorPrefs.reputation) + reputationAdjustment
            });
        }

        // If the new vote is different from the previous vote, create a new vote and adjust reputation
        if (!existingVotes.documents[0] || existingVotes.documents[0]?.voteStatus !== voteStatus) {
            await databases.createDocument(db, voteCollection, ID.unique(), {
                type: type,
                typeId: typeId,
                voteStatus: voteStatus,
                votedById: votedById
            });

            const questionOrAnswer = await databases.getDocument(db, type === "question" ? questionCollection : answerCollection, typeId);
            const authorPrefs = await users.getPrefs<UserPrefs>(questionOrAnswer.authorId);

            const reputationAdjustment = voteStatus === "upvoted" ? 1 : -1;
            await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
                reputation: Number(authorPrefs.reputation) + reputationAdjustment
            });
        }

        // Count upvotes and downvotes
        const [upvotes, downvotes] = await Promise.all([
            databases.listDocuments(db, voteCollection, [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("voteStatus", "upvoted"),
                Query.limit(1)
            ]),
            databases.listDocuments(db, voteCollection, [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("voteStatus", "downvoted"),
                Query.limit(1)
            ])
        ]);

        return NextResponse.json({
            data: {
                document: null,
                voteResults: {
                    upvotes: upvotes.total,
                    downvotes: downvotes.total
                }
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error?.message || "Error processing vote"
        }, {
            status: error?.status || error?.code || 500
        });
    }
} 