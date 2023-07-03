import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { IonIcon, useIonModal, useIonToast } from "@ionic/react";
import { arrowDownSharp, arrowUpSharp } from "ionicons/icons";
import React, { useCallback, useContext, useMemo } from "react";
import SlidingItem, {
  SlidingItemAction,
  SlidingItemProps,
} from "./SlidingItem";
import {
  CommentReplyView,
  CommentView,
  PersonMentionView,
  PostView,
} from "lemmy-js-client";
import { PageContext } from "../../auth/PageContext";
import { useAppDispatch, useAppSelector } from "../../../store";
import Login from "../../auth/Login";
import { voteOnPost } from "../../post/postSlice";
import { voteError } from "../../../helpers/toastMessages";
import { voteOnComment } from "../../comment/commentSlice";
import { jwtSelector } from "../../auth/authSlice";
import { ModalContext } from "../../../pages/shared/ModalContext";

const VoteArrow = styled(IonIcon)<{
  slash: boolean;
  bgColor: string;
}>`
  ${({ slash, bgColor }) =>
    slash &&
    css`
      &::after {
        content: "";
        position: absolute;
        height: 30px;
        width: 3px;
        background: white;
        font-size: 1.7em;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        transform-origin: center;
        box-shadow: 0 0 0 2px var(--ion-color-${bgColor});
      }
    `}
`;

interface BaseSlidingVoteProps {
  children: React.ReactNode;
  className?: string;
  item: CommentView | PostView | PersonMentionView | CommentReplyView;
  endActions: SlidingItemProps["endActions"];
}

export default function BaseSlidingVote({
  children,
  className,
  item,
  endActions,
}: BaseSlidingVoteProps) {
  const pageContext = useContext(PageContext);
  const [present] = useIonToast();
  const dispatch = useAppDispatch();
  const jwt = useAppSelector(jwtSelector);
  const postVotesById = useAppSelector((state) => state.post.postVotesById);
  const commentVotesById = useAppSelector(
    (state) => state.comment.commentVotesById
  );
  const typedMyVote = item.my_vote as 1 | -1 | 0 | undefined;
  const isPost = "unread_comments" in item;
  const currentVote = isPost
    ? postVotesById[item.post.id] ?? typedMyVote
    : commentVotesById[item.comment.id] ?? typedMyVote;

  const { login } = useContext(ModalContext);

  const onVote = useCallback(
    async (score: 1 | -1 | 0) => {
      if (jwt) {
        try {
          if (isPost) await dispatch(voteOnPost(item.post.id, score));
          else await dispatch(voteOnComment(item.comment.id, score));
        } catch (error) {
          present(voteError);
        }
      } else login({ presentingElement: pageContext.page });
    },
    [dispatch, isPost, item, jwt, login, pageContext.page, present]
  );

  const startActions: [SlidingItemAction, SlidingItemAction] = useMemo(() => {
    return [
      {
        render: () => (
          <VoteArrow
            slash={currentVote === 1}
            bgColor="primary"
            icon={arrowUpSharp}
          />
        ),
        trigger: () => {
          onVote(currentVote === 1 ? 0 : 1);
        },
        bgColor: "primary",
      },
      {
        render: () => (
          <VoteArrow
            slash={currentVote === -1}
            bgColor="danger"
            icon={arrowDownSharp}
          />
        ),
        trigger: () => {
          onVote(currentVote === -1 ? 0 : -1);
        },
        bgColor: "danger",
      },
    ];
  }, [currentVote, onVote]);

  return (
    <SlidingItem
      startActions={startActions}
      endActions={endActions}
      className={className}
    >
      {children}
    </SlidingItem>
  );
}
