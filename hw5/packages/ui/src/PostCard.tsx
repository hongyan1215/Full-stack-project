import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { PostActions } from "./PostActions";
import { PostMenu } from "./PostMenu";
import { MENTION_REGEX } from "@utils/shared";

interface User {
  id: string;
  name: string | null;
  userId: string | null;
  image: string | null;
}

interface Post {
  id: string;
  text: string;
  createdAt: Date | string;
  author: User;
  isRepost?: boolean;
  isLiked?: boolean;
  isReposted?: boolean;
  replyCount?: number;
  _count?: {
    likes: number;
    reposts: number;
  };
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onReply?: () => void;
  onClick?: () => void;
}

function renderTextWithLinksAndMentions(text: string) {
  const urlRegex = /https?:\/\/\S+/g;
  const mentionRegex = /(^|\s)@([a-z0-9_]{3,20})/g;
  
  const parts: (string | JSX.Element)[] = [];
  const matches: Array<{ type: "url" | "mention"; index: number; length: number; content: string; userId?: string }> = [];

  // Find all URL matches
  Array.from(text.matchAll(urlRegex)).forEach((match) => {
    if (match.index !== undefined) {
      matches.push({
        type: "url",
        index: match.index,
        length: match[0].length,
        content: match[0],
      });
    }
  });

  // Find all mention matches
  Array.from(text.matchAll(mentionRegex)).forEach((match) => {
    if (match.index !== undefined) {
      matches.push({
        type: "mention",
        index: match.index + match[1].length, // Adjust for leading whitespace
        length: match[0].trim().length,
        content: match[0].trim(),
        userId: match[2],
      });
    }
  });

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  let lastIndex = 0;
  let key = 0;

  matches.forEach((match) => {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the match
    if (match.type === "url") {
      parts.push(
        <a
          key={`link-${key++}`}
          href={match.content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {match.content}
        </a>
      );
    } else if (match.type === "mention" && match.userId) {
      parts.push(
        <Link
          key={`mention-${key++}`}
          href={`/${match.userId}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {match.content}
        </Link>
      );
    } else {
      parts.push(match.content);
    }

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function PostCard({ post, currentUserId, onReply, onClick }: PostCardProps) {
  const createdAt = typeof post.createdAt === "string" ? new Date(post.createdAt) : post.createdAt;
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <article
      className={`border-b border-x-border p-4 transition ${
        onClick ? "hover:bg-x-hover cursor-pointer" : ""
      }`}
      onClick={onClick ? handleClick : undefined}
    >
      {post.isRepost && (
        <div className="mb-2 flex items-center gap-2 text-xs text-x-textSecondary">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V20H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 2.71H11V4h5.25c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3-4.603-4.3 1.706-1.82L18 15.62V8.25c0-.97-.784-1.75-1.75-1.75z" />
          </svg>
          <span>Reposted</span>
        </div>
      )}
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {post.author.image ? (
            <img
              src={post.author.image}
              alt={post.author.name || "User"}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-x-border" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-x-text">
                {post.author.name || "Anonymous"}
              </span>
              {post.author.userId && (
                <Link
                  href={`/${post.author.userId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-x-textSecondary hover:underline"
                >
                  @{post.author.userId}
                </Link>
              )}
              <span className="text-x-textSecondary">·</span>
              <span className="text-x-textSecondary text-sm">{timeAgo}</span>
            </div>
            <PostMenu
              postId={post.id}
              authorId={post.author.id}
              currentUserId={currentUserId}
              isRepost={post.isRepost}
            />
          </div>

          <p className="mt-1 whitespace-pre-wrap text-x-text break-words">
            {renderTextWithLinksAndMentions(post.text)}
          </p>

          <PostActions
            postId={post.id}
            replyCount={post.replyCount}
            repostCount={post._count?.reposts || 0}
            likeCount={post._count?.likes || 0}
            isLiked={post.isLiked}
            isReposted={post.isReposted}
            onReply={onReply}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </article>
  );
}
