export interface Customer {
  id: number;
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  budget: string;
  intentLevel: 'High' | 'Medium' | 'Low';
  lastContact: string;
  notes?: string;
  industry?: string;
  stage?: 'Leads' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won';
  source?: 'LinkedIn' | 'Website' | 'Referral' | 'Cold Call' | 'Event';
  followUpCount?: number;
  // 合同相关字段
  contractValue?: string; // 合同价值
  contractStatus?: 'Pending' | 'Signed' | 'Expired' | 'Cancelled'; // 合同状态
  contractStartDate?: string; // 合同开始日期
  contractEndDate?: string; // 合同结束日期
  expectedCloseDate?: string; // 预计成交日期
  probability?: number; // 成交概率（0-100）
  annualRevenue?: string; // 年度收入贡献
}

export interface ScriptSuggestion {
  type: string;
  content: string;
}

export interface KnowledgeItem {
  id: number;
  title: string;
  type: 'Product Info' | 'Case Study' | 'Script Template' | 'Other';
  tags: string[];
  uploadDate: string;
  content?: string;
  relevance?: number; // For search results
}

export interface ConversationMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
}