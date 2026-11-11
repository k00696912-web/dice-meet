import type { ComponentProps } from "react";
import type { IconName } from "@/components/dashboard/icons";
import type { Badge } from "@/components/ui";
import type { Session } from "@/lib/types";

export type NpcState = "enabled" | "pending" | "disabled";
// 与 database/schema.sql 中 ai_npcs.relationship 的 CHECK 取值一致
export type Relationship = "ally" | "enemy" | "neutral" | "mysterious";
type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

/**
 * 演示 NPC，字段形状对齐 ai_npcs 列：name / personality(TEXT，用「 · 」分隔) /
 * background / relationship / behavior_boundaries / secrets / model / enabled。
 * state 中的 pending 与 lastActive 在数据库里没有对应列，页面已标注为演示。
 * key 是稳定 slug，同时作为 /npcs/[id] 的路由参数。
 */
export interface Npc {
  key: string;
  name: string;
  personality: string;
  background: string;
  relationship: Relationship;
  behavior_boundaries: string;
  secrets: string;
  model: string;
  state: NpcState;
  /** ai_npcs.session_id 的演示绑定：优先匹配该系统，否则按序号取公告板委托 */
  preferSystem: string;
  sessionSlot: number;
  /** 演示：真实值需从 ai_npc_logs.created_at 聚合推导 */
  lastActive: string;
}

export const NPCS: Npc[] = [
  {
    key: "vex",
    name: "维克斯",
    personality: "多疑 · 话少 · 守口如瓶",
    background: "夜之城的老牌义体医生，只在玩家伤重站不稳时才会出现。",
    relationship: "mysterious",
    behavior_boundaries: "不替玩家做决定；不透露其他 NPC 的秘密；不提供规则书之外的义体数据。",
    secrets: "他当年的手术台上有过一具不该存在的义体，记录是他自己删的。",
    model: "auto",
    state: "enabled",
    preferSystem: "Cyberpunk RED",
    sessionSlot: 0,
    lastActive: "12 分钟前",
  },
  {
    key: "ashawk",
    name: "灰隼",
    personality: "健谈 · 好奇 · 爱指路",
    background: "北境小镇酒馆的老板娘，掌握着商队与佣兵的所有传闻。",
    relationship: "ally",
    behavior_boundaries: "不介入玩家之间的争执；不在场时不代替玩家发言。",
    secrets: "她认得商队徽记上被抹掉的那一家，但从不主动提起。",
    model: "auto",
    state: "enabled",
    preferSystem: "D&D 5e",
    sessionSlot: 1,
    lastActive: "1 小时前",
  },
  {
    key: "silent-mr",
    name: "沈默先生",
    personality: "礼貌 · 阴冷 · 步步紧逼",
    background: "总在调查员最脆弱时登门的绅士，没有人记得是谁放他进来的。",
    relationship: "enemy",
    behavior_boundaries: "不直接伤害玩家角色，只制造处境；不越过模组既定的时间线。",
    secrets: "他每次登门都带着同一张被雨水泡过的名片，收件人是调查员自己。",
    model: "auto",
    state: "pending",
    preferSystem: "COC 7th",
    sessionSlot: 2,
    lastActive: "昨天",
  },
  {
    key: "azhu",
    name: "阿烛",
    personality: "活泼 · 追问 · 记仇",
    background: "一盏会说话的引魂灯，专门给第一次跑团的玩家解释规则。",
    relationship: "neutral",
    behavior_boundaries: "只解释规则，不替玩家判定；不提前透露剧本结局。",
    secrets: "灯芯是某个没跑完团的玩家留下的，名字已经被抹掉。",
    model: "auto",
    state: "enabled",
    preferSystem: "泛用无界",
    sessionSlot: 3,
    lastActive: "昨天",
  },
  {
    key: "screw",
    name: "螺丝",
    personality: "嘴贫 · 热心 · 贪小便宜",
    background: "无人机修师，能用报废零件拼出一把响得起来的枪。",
    relationship: "ally",
    behavior_boundaries: "不白干活，交易条件必须说清；不碰没人请求的义体。",
    secrets: "仓库最里面那台机器他从不给任何人看，也从不充电。",
    model: "auto",
    state: "enabled",
    preferSystem: "Cyberpunk RED",
    sessionSlot: 4,
    lastActive: "2 天前",
  },
  {
    key: "whitecoat",
    name: "白大褂",
    personality: "冷静 · 术语多 · 回避",
    background: "疗养院的夜班医生，病历本里永远缺关键的一页。",
    relationship: "mysterious",
    behavior_boundaries: "只给症状不给诊断结论；活动范围不超出疗养院。",
    secrets: "病历本缺的那一页是他自己撕掉的。",
    model: "auto",
    state: "pending",
    preferSystem: "COC 7th",
    sessionSlot: 5,
    lastActive: "3 天前",
  },
  {
    key: "laohe",
    name: "老何",
    personality: "沉稳 · 谨慎 · 一诺千金",
    background: "佣兵团的军需官，负责在玩家冲动时提醒他们代价。",
    relationship: "neutral",
    behavior_boundaries: "不隐瞒代价；不在玩家冲动时附和；不私放补给。",
    secrets: "他年轻时带过一支这样的队伍，只有他活了下来。",
    model: "auto",
    state: "disabled",
    preferSystem: "D&D 5e",
    sessionSlot: 6,
    lastActive: "7 天前",
  },
  {
    key: "fog",
    name: "雾",
    personality: "沉默 · 模仿 · 难以捉摸",
    background: "跟着队伍翻山的山雾，会重复玩家最后一句说过的话。",
    relationship: "enemy",
    behavior_boundaries: "只重复玩家说过的话，不主动提供信息；不触碰不在场的角色。",
    secrets: "它反复那句台词，来自上一次没能通关的队伍。",
    model: "auto",
    state: "disabled",
    preferSystem: "泛用无界",
    sessionSlot: 7,
    lastActive: "2 周前",
  },
];

export const RELATIONSHIP_META: Record<
  Relationship,
  { label: string; variant: BadgeVariant; hint: string }
> = {
  ally: { label: "盟友", variant: "success", hint: "站在玩家一侧" },
  neutral: { label: "中立", variant: "neutral", hint: "各取所需" },
  mysterious: { label: "神秘", variant: "accent", hint: "动机未知" },
  enemy: { label: "敌对", variant: "danger", hint: "与玩家作对" },
};

export const STATE_META: Record<
  NpcState,
  { label: string; variant: BadgeVariant; icon: IconName; demo: boolean }
> = {
  enabled: { label: "已启用", variant: "success", icon: "shield", demo: false },
  pending: { label: "待审核", variant: "warning", icon: "clock", demo: true },
  disabled: { label: "已停用", variant: "neutral", icon: "close", demo: false },
};

/** 把演示 NPC 绑到公告板真实委托：优先同系统，否则按序号取 */
export function pickSession(sessions: Session[], preferSystem: string, slot: number): Session | undefined {
  if (sessions.length === 0) return undefined;
  const bySystem = sessions.find((s) => s.system === preferSystem);
  if (bySystem) return bySystem;
  return sessions[slot % sessions.length];
}
