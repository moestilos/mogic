import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('mogic_users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  color: text('color').notNull().default('U'),
  avatar: text('avatar').notNull().default('Crown'),
  theme: text('theme').default('chrome'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const friends = pgTable('mogic_friends', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendUserId: uuid('friend_user_id').references(() => users.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  color: text('color').notNull().default('U'),
  avatar: text('avatar').notNull().default('User'),
  wins: integer('wins').notNull().default(0),
  games: integer('games').notNull().default(0),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ownerIdx: index('mogic_friends_owner_idx').on(t.ownerId),
}));

export const groups = pgTable('mogic_groups', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('Crown'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ownerIdx: index('mogic_groups_owner_idx').on(t.ownerId),
}));

export const groupProfiles = pgTable('mogic_group_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  friendId: uuid('friend_id').references(() => friends.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  color: text('color').notNull().default('U'),
  avatar: text('avatar').notNull().default('User'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  groupIdx: index('mogic_group_profiles_group_idx').on(t.groupId),
}));

export const friendRequests = pgTable('mogic_friend_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId: uuid('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
}, (t) => ({
  fromIdx: index('mogic_friend_requests_from_idx').on(t.fromUserId),
  toIdx: index('mogic_friend_requests_to_idx').on(t.toUserId),
}));

export const groupResults = pgTable('mogic_group_results', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  format: text('format').notNull().default('commander'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }).notNull(),
  placements: jsonb('placements').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  groupIdx: index('mogic_group_results_group_idx').on(t.groupId),
}));
