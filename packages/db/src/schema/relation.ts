import { relations } from "drizzle-orm";
import { calendarNote, engagementItem, media, notification, organizationSetting } from "./app";
import { activityLog, auditLog, draftInteraction, publishError } from "./audit";
import { account, invitation, member, organization, session, twoFactor, user } from "./auth";
import { payment, subscription } from "./billing";
import { blogComment } from "./blogcomment";
import { blogPost } from "./blogpost";
import { competitor } from "./competitor";
import { contentPillar, hashtagCollection } from "./content";
import { post, postMedia } from "./post";
import { skBrandKnowledge, skRecommendation, skReport } from "./sk";
import {
  skChatMessage,
  skChatSession,
  skExperiment,
  skMediaAnalysis,
  skPlatformKnowledge,
} from "./sk_chat";
import { socialAccount } from "./social-account";

// ── Auth Relations ─────────────────────────────────────────────────
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  twoFactors: many(twoFactor),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  subscriptions: many(subscription),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

// ── Billing Relations ──────────────────────────────────────────────
export const paymentRelations = relations(payment, ({ one }) => ({
  organization: one(organization, {
    fields: [payment.organizationId],
    references: [organization.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  organization: one(organization, {
    fields: [subscription.organizationId],
    references: [organization.id],
  }),
}));

// ── Competitor Relations ───────────────────────────────────────────
export const competitorRelations = relations(competitor, ({ one }) => ({
  organization: one(organization, {
    fields: [competitor.organizationId],
    references: [organization.id],
  }),
}));

// ── Social Account Relations ───────────────────────────────────────
export const socialAccountRelations = relations(socialAccount, ({ one, many }) => ({
  organization: one(organization, {
    fields: [socialAccount.organizationId],
    references: [organization.id],
  }),
  posts: many(post),
}));

// ── Post Relations ────────────────���────────────────────────────────
export const postRelations = relations(post, ({ one, many }) => ({
  organization: one(organization, {
    fields: [post.organizationId],
    references: [organization.id],
  }),
  socialAccount: one(socialAccount, {
    fields: [post.socialAccountId],
    references: [socialAccount.id],
  }),
  pillar: one(contentPillar, {
    fields: [post.pillarId],
    references: [contentPillar.id],
  }),
  media: many(postMedia),
  publishErrors: many(publishError),
  draftInteractions: many(draftInteraction),
}));

// ── Media Relations ────────────────────────────────────────────────
export const mediaRelations = relations(media, ({ one, many }) => ({
  organization: one(organization, {
    fields: [media.organizationId],
    references: [organization.id],
  }),
  posts: many(postMedia),
  skAnalyses: many(skMediaAnalysis),
}));

// ── Post Media Relations ───────────────────────────────────────────
export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(post, {
    fields: [postMedia.postId],
    references: [post.id],
  }),
  media: one(media, {
    fields: [postMedia.mediaId],
    references: [media.id],
  }),
}));

// ── Calendar Note Relations ────────────────────────────────────────
export const calendarNoteRelations = relations(calendarNote, ({ one }) => ({
  organization: one(organization, {
    fields: [calendarNote.organizationId],
    references: [organization.id],
  }),
}));

// ── Notification Relations ─────────────────────────────────────────
export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [notification.organizationId],
    references: [organization.id],
  }),
}));

// ── Content Pillar Relations ───────────────────────────────────────
export const contentPillarRelations = relations(contentPillar, ({ one, many }) => ({
  organization: one(organization, {
    fields: [contentPillar.organizationId],
    references: [organization.id],
  }),
  posts: many(post),
}));

// ── Hashtag Collection Relations ───────────────────────────────────
export const hashtagCollectionRelations = relations(hashtagCollection, ({ one }) => ({
  organization: one(organization, {
    fields: [hashtagCollection.organizationId],
    references: [organization.id],
  }),
}));

// ── Organization Setting Relations ─────────────────────────────────
export const organizationSettingRelations = relations(organizationSetting, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationSetting.organizationId],
    references: [organization.id],
  }),
}));

// ── Engagement Item Relations ──────────────────────────────────────
export const engagementItemRelations = relations(engagementItem, ({ one }) => ({
  organization: one(organization, {
    fields: [engagementItem.organizationId],
    references: [organization.id],
  }),
}));

// ── Audit Relations ────────���───────────────────────────────────────
export const auditLogRelations = relations(auditLog, ({ one }) => ({
  organization: one(organization, {
    fields: [auditLog.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

export const draftInteractionRelations = relations(draftInteraction, ({ one }) => ({
  organization: one(organization, {
    fields: [draftInteraction.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [draftInteraction.userId],
    references: [user.id],
  }),
}));

export const publishErrorRelations = relations(publishError, ({ one }) => ({
  post: one(post, {
    fields: [publishError.postId],
    references: [post.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  organization: one(organization, {
    fields: [activityLog.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [activityLog.userId],
    references: [user.id],
  }),
}));

// ── Seb (SK) AI Coach Relations ────────────────────────────────────
export const skReportRelations = relations(skReport, ({ one, many }) => ({
  organization: one(organization, {
    fields: [skReport.organizationId],
    references: [organization.id],
  }),
  recommendations: many(skRecommendation),
  experiments: many(skExperiment),
}));

export const skRecommendationRelations = relations(skRecommendation, ({ one }) => ({
  organization: one(organization, {
    fields: [skRecommendation.organizationId],
    references: [organization.id],
  }),
  socialAccount: one(socialAccount, {
    fields: [skRecommendation.socialAccountId],
    references: [socialAccount.id],
  }),
  report: one(skReport, {
    fields: [skRecommendation.reportId],
    references: [skReport.id],
  }),
}));

export const skBrandKnowledgeRelations = relations(skBrandKnowledge, ({ one }) => ({
  organization: one(organization, {
    fields: [skBrandKnowledge.organizationId],
    references: [organization.id],
  }),
}));

export const skChatSessionRelations = relations(skChatSession, ({ one, many }) => ({
  organization: one(organization, {
    fields: [skChatSession.organizationId],
    references: [organization.id],
  }),
  messages: many(skChatMessage),
}));

export const skChatMessageRelations = relations(skChatMessage, ({ one }) => ({
  session: one(skChatSession, {
    fields: [skChatMessage.sessionId],
    references: [skChatSession.id],
  }),
}));

export const skMediaAnalysisRelations = relations(skMediaAnalysis, ({ one }) => ({
  organization: one(organization, {
    fields: [skMediaAnalysis.organizationId],
    references: [organization.id],
  }),
  media: one(media, {
    fields: [skMediaAnalysis.mediaId],
    references: [media.id],
  }),
}));

export const skExperimentRelations = relations(skExperiment, ({ one }) => ({
  organization: one(organization, {
    fields: [skExperiment.organizationId],
    references: [organization.id],
  }),
  report: one(skReport, {
    fields: [skExperiment.reportId],
    references: [skReport.id],
  }),
}));

export const skPlatformKnowledgeRelations = relations(skPlatformKnowledge, () => ({}));

export const blogPostRelations = relations(blogPost, ({ many }) => ({
  comments: many(blogComment),
}));

export const blogCommentRelations = relations(blogComment, ({ one, many }) => ({
  post: one(blogPost, {
    fields: [blogComment.postId],
    references: [blogPost.id],
  }),
  organization: one(organization, {
    fields: [blogComment.organizationId],
    references: [organization.id],
  }),
  parent: one(blogComment, {
    fields: [blogComment.parentId],
    references: [blogComment.id],
  }),
  replies: many(blogComment),
}));
