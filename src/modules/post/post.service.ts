import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { Post, PostDocument } from "../../database/schemas/post.schema";
import { User } from "../../database/schemas/user.schema";
import { UserRole } from "../../enums/user.enum";
import { CreatePostDto, GetPostsQueryDto, UpdatePostDto } from "./post.dto";

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const post = new this.postModel({
      ...createPostDto,
      author: author._id,
    });
    return await post.save();
  }

  async feed(query: GetPostsQueryDto, user: User): Promise<Post[]> {
    const { search, page = 1, limit = 10 } = query;

    const aggregate = await this.postModel.aggregate([
      { $match: { deletedAt: null } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          pagination: [
            {
              $count: "totalResults",
            },
            {
              $addFields: {
                page,
                limit,
                totalPages: {
                  $ceil: {
                    $divide: ["$totalResults", limit],
                  },
                },
              },
            },
          ],
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      email: 1,
                      firstName: 1,
                      lastName: 1,
                    },
                  },
                ],
                as: "author",
              },
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likeable",
                pipeline: [
                  {
                    $match: { user: new mongoose.Types.ObjectId(user._id) },
                  },
                ],
                as: "isLike",
              },
            },
            {
              $addFields: {
                isLike: { $cond: [{ $size: "$isLike" }, true, false] },
                imageUrl: {
                  $cond: [
                    { $ne: ["$imageUrl", null] },
                    { $concat: [process.env.BASE_URL, "/", "$imageUrl"] },
                    null,
                  ],
                },
                videoUrl: {
                  $cond: [
                    { $ne: ["$videoUrl", ""] },
                    { $concat: [process.env.BASE_URL, "/", "$videoUrl"] },
                    null,
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$pagination",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                $ifNull: [
                  "$pagination",
                  { totalResults: 0, page, limit, totalPages: 0 },
                ],
              },
              { results: "$data" },
            ],
          },
        },
      },
    ]);

    return aggregate;
  }

  async post(query: GetPostsQueryDto, user: User): Promise<Post[]> {
    const { search, page = 1, limit = 10, author } = query;

    const aggregate = await this.postModel.aggregate([
      {
        $match: {
          deletedAt: null,
          author: new mongoose.Types.ObjectId(author),
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          pagination: [
            {
              $count: "totalResults",
            },
            {
              $addFields: {
                page,
                limit,
                totalPages: {
                  $ceil: {
                    $divide: ["$totalResults", limit],
                  },
                },
              },
            },
          ],
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      email: 1,
                      firstName: 1,
                      lastName: 1,
                    },
                  },
                ],
                as: "author",
              },
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likeable",
                pipeline: [
                  {
                    $match: { user: new mongoose.Types.ObjectId(user._id) },
                  },
                ],
                as: "isLike",
              },
            },
            {
              $addFields: {
                isLike: { $cond: [{ $size: "$isLike" }, true, false] },
                imageUrl: {
                  $cond: [
                    { $ne: ["$imageUrl", null] },
                    { $concat: [process.env.BASE_URL, "/", "$imageUrl"] },
                    null,
                  ],
                },
                videoUrl: {
                  $cond: [
                    { $ne: ["$videoUrl", ""] },
                    { $concat: [process.env.BASE_URL, "/", "$videoUrl"] },
                    null,
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$pagination",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                $ifNull: [
                  "$pagination",
                  { totalResults: 0, page, limit, totalPages: 0 },
                ],
              },
              { results: "$data" },
            ],
          },
        },
      },
    ]);

    return aggregate;
  }

  async findOne(id: string): Promise<Post> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Post not found");
    }

    const post = await this.postModel
      .findOne({ _id: id, deletedAt: null })
      .populate("author", "firstName lastName email")
      .exec();

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    user: User,
  ): Promise<Post> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Post not found");
    }

    const post = await this.postModel
      .findOne({ _id: id, deletedAt: null })
      .exec();

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (
      post.author.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("You can only update your own posts");
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, { ...updatePostDto }, { new: true })
      .populate("author", "firstName lastName email")
      .exec();

    return updatedPost;
  }

  async remove(id: string, user: User): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Post not found");
    }

    const post = await this.postModel
      .findOne({ _id: id, deletedAt: null })
      .exec();

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Check if user is the author or admin
    if (
      post.author.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    await this.postModel
      .findByIdAndUpdate(id, { deletedAt: new Date() })
      .exec();
  }
}
