import { Customer, KnowledgeItem, ScriptSuggestion } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: 10001,
    name: 'John Doe',
    company: 'TechNova Solutions',
    position: 'CTO',
    phone: '13812345678',
    email: 'john@technova.com',
    budget: '$50k',
    intentLevel: 'High',
    lastContact: '2025-01-25',
    industry: 'SaaS',
    stage: 'Negotiation',
    source: 'LinkedIn',
    followUpCount: 8,
    contractValue: '$50,000',
    contractStatus: 'Pending',
    expectedCloseDate: '2025-02-15',
    probability: 85,
    annualRevenue: '$50,000'
  },
  {
    id: 10002,
    name: 'Alice Smith',
    company: 'GreenLeaf Medical',
    position: 'Purchasing Mgr',
    phone: '13987654321',
    email: 'alice@greenleaf.com',
    budget: 'TBD',
    intentLevel: 'Medium',
    lastContact: '2025-01-24',
    industry: 'Healthcare',
    stage: 'Qualified',
    source: 'Website',
    followUpCount: 3,
    contractValue: '$75,000',
    contractStatus: 'Pending',
    expectedCloseDate: '2025-03-01',
    probability: 60,
    annualRevenue: '$0'
  },
  {
    id: 10003,
    name: 'Bob Johnson',
    company: 'BuildIt Corp',
    position: 'Director',
    phone: '13700001111',
    email: 'bob@buildit.com',
    budget: '$120k',
    intentLevel: 'Low',
    lastContact: '2025-01-20',
    industry: 'Construction',
    stage: 'Leads',
    source: 'Cold Call',
    followUpCount: 1,
    contractValue: '$120,000',
    contractStatus: 'Pending',
    expectedCloseDate: '2025-04-01',
    probability: 25,
    annualRevenue: '$0'
  },
  {
    id: 10004,
    name: '李明',
    company: '华兴科技',
    position: '产品总监',
    phone: '13811112222',
    email: 'liming@huaxing.com',
    budget: '¥30万',
    intentLevel: 'High',
    lastContact: '2025-01-26',
    industry: '金融科技',
    stage: 'Proposal',
    source: 'Event',
    followUpCount: 5,
    contractValue: '¥300,000',
    contractStatus: 'Pending',
    expectedCloseDate: '2025-02-20',
    probability: 75,
    annualRevenue: '$0'
  },
  {
    id: 10005,
    name: 'Sarah Chen',
    company: 'CloudNine Tech',
    position: 'CEO',
    phone: '13933334444',
    email: 'sarah@cloudnine.com',
    budget: '$200k',
    intentLevel: 'High',
    lastContact: '2025-01-23',
    industry: 'Cloud Services',
    stage: 'Negotiation',
    source: 'Referral',
    followUpCount: 12,
    contractValue: '$200,000',
    contractStatus: 'Signed',
    contractStartDate: '2025-01-15',
    contractEndDate: '2026-01-15',
    expectedCloseDate: '2025-01-15',
    probability: 100,
    annualRevenue: '$200,000'
  },
  {
    id: 10006,
    name: 'Mike Wang',
    company: 'StartUp Inc',
    position: 'Founder',
    phone: '13655556666',
    email: 'mike@startup.com',
    budget: '$25k',
    intentLevel: 'Medium',
    lastContact: '2025-01-22',
    industry: 'E-commerce',
    stage: 'Qualified',
    source: 'LinkedIn',
    followUpCount: 4,
    contractValue: '$25,000',
    contractStatus: 'Pending',
    expectedCloseDate: '2025-02-28',
    probability: 50,
    annualRevenue: '$0'
  }
];

export const mockCustomerAnalysis = {
  industry: 'SaaS',
  companySize: '50-200 employees',
  concerns: ['价格敏感', '数据安全', '集成复杂度', '实施时间'],
  intent: '高意向',
  recommendedApproach: '强调 ROI 和安全认证，提供分期付款方案'
};

export const mockRecommendedScripts: ScriptSuggestion[] = [
  {
    type: '开场话术',
    content: '您好[客户姓名]，我是[公司]的[您的姓名]。了解到贵公司在[行业]领域的发展，我们帮助过类似[同行公司]的企业实现了[具体收益]，希望能和您聊聊如何帮助[客户公司]提升[业务目标]。'
  },
  {
    type: '异议处理 - 价格',
    content: '我完全理解您对预算的考量。不过从 ROI 角度看，我们的客户通常在[时间]内就能收回投资。比如[相似案例]，他们在使用我们产品后，[具体收益]。而且我们可以提供[灵活付款方案]。'
  },
  {
    type: '异议处理 - 竞品对比',
    content: '您提到[竞品]确实也是市场上的选择。不过我们的核心优势在于[独特优势1]和[独特优势2]。特别是[具体场景]，我们的解决方案可以[客户价值]，这是其他产品难以实现的。'
  },
  {
    type: '促成话术',
    content: '基于我们之前的讨论，[客户公司]目前在[痛点]方面确实有提升空间。如果这个月能启动，我还可以为您申请[特殊优惠]。您看这周或下周哪个时间方便，我们详细过一下实施计划？'
  },
  {
    type: '跟进话术',
    content: '您好[客户姓名]，上次聊到[讨论内容]，想了解一下您这边的进展如何？我这边准备了一些[补充资料/案例/方案]，可能对您的决策有帮助。不知这周是否有时间简短交流一下？'
  }
];

export const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: 1,
    title: '企业版产品功能介绍',
    type: 'Product Info',
    tags: ['产品', '企业版', '功能清单'],
    uploadDate: '2025-01-15',
    content: '企业版包含以下核心功能：智能客户管理、AI 销售助手、数据分析看板、自定义报表、API 集成、多级权限管理等。'
  },
  {
    id: 2,
    title: '某大型银行成功案例',
    type: 'Case Study',
    tags: ['金融', '成功案例', 'ROI'],
    uploadDate: '2025-01-10',
    content: '某大型银行使用我们的 CRM 系统后，销售效率提升 40%，客户转化率提高 35%，6 个月内实现投资回报率 280%。'
  },
  {
    id: 3,
    title: '首次拜访客户话术模板',
    type: 'Script Template',
    tags: ['话术', '首次拜访', '开场'],
    uploadDate: '2025-01-08',
    content: '首次拜访话术框架：开场白 → 公司介绍 → 需求挖掘 → 方案展示 → 异议处理 → 下一步约定。'
  },
  {
    id: 4,
    title: 'SaaS 行业销售指南',
    type: 'Product Info',
    tags: ['SaaS', '销售', '行业'],
    uploadDate: '2025-01-05',
    content: 'SaaS 行业销售要点：强调订阅价值、展示长期 ROI、提供试用、关注客户成功、建立持续服务关系。'
  },
  {
    id: 5,
    title: '价格谈判策略手册',
    type: 'Script Template',
    tags: ['谈判', '定价', '策略'],
    uploadDate: '2025-01-01',
    content: '价格谈判策略：价值优先、锚定效应、让步技巧、创造附加价值、提供灵活方案、强调长期价值。'
  }
];

export const mockDashboardStats = {
  totalPotential: 156,
  pipelineValue: '$2.4M',
  winRate: '32%',
  avgDealSize: '$45k',
  prospectsGrowth: 12,
  valueGrowth: 8,
  winRateGrowth: 5,
  avgDealGrowth: -3,
  revenueData: [
    { month: '8月', value: 180000 },
    { month: '9月', value: 220000 },
    { month: '10月', value: 195000 },
    { month: '11月', value: 280000 },
    { month: '12月', value: 320000 },
    { month: '1月', value: 350000 }
  ],
  funnelData: [
    { stage: '潜在客户', value: 450, count: 156 },
    { stage: '合格线索', value: 280, count: 89 },
    { stage: '方案阶段', value: 150, count: 45 },
    { stage: '谈判阶段', value: 95, count: 28 },
    { stage: '赢单', value: 62, count: 18 }
  ]
};

export const mockActivities = [
  {
    id: 1,
    type: 'call',
    user: '张三',
    action: '与客户通话',
    target: 'John Doe - TechNova Solutions',
    time: '10分钟前',
    result: '达成下一步会议约定',
    text: '与客户 John Doe 通话，达成下一步会议约定'
  },
  {
    id: 2,
    type: 'email',
    user: '李四',
    action: '发送邮件',
    target: 'Alice Smith - GreenLeaf Medical',
    time: '30分钟前',
    result: '发送产品方案',
    text: '向 Alice Smith 发送产品方案邮件'
  },
  {
    id: 3,
    type: 'meeting',
    user: '王五',
    action: '完成演示',
    target: '李明 - 华兴科技',
    time: '1小时前',
    result: '客户表示浓厚兴趣',
    text: '为李明完成产品演示，客户表示浓厚兴趣'
  },
  {
    id: 4,
    type: 'note',
    user: '赵六',
    action: '添加跟进记录',
    target: 'Bob Johnson - BuildIt Corp',
    time: '2小时前',
    result: '记录客户预算时间线',
    text: '为 Bob Johnson 添加跟进记录：预算时间线'
  }
];

// AI 对话流程 - 用于新增客户的 AI 对话模式
export const mockConversationFlow = [
  {
    field: 'name',
    text: "您好！我是您的 AI 销售助手。让我帮您录入新客户信息。首先，请告诉我客户的姓名是什么？"
  },
  {
    field: 'company',
    text: "好的，记下了。请问客户所在的公司名称是什么？"
  },
  {
    field: 'position',
    text: "明白了。客户在公司担任什么职位？"
  },
  {
    field: 'phone',
    text: "好的。请问客户的联系电话是什么？"
  },
  {
    field: 'email',
    text: "收到。客户的邮箱地址是什么？"
  },
  {
    field: 'industry',
    text: "了解了。客户所在行业是什么？比如：SaaS、金融科技、医疗、制造业等。"
  },
  {
    field: 'budget',
    text: "好的。客户的预算范围大概是多少？比如：$50k、$100k、待定等。"
  },
  {
    field: 'done',
    text: "完美！我已经收集到所有必要信息。您可以查看表单确认所有细节，或继续录入下一个客户。"
  }
];

// AI 建议分析
export const mockAiSuggestions = {
  industry: 'SaaS - 软件服务',
  companySize: '50-200 人',
  intentLevel: '高意向',
  nextActions: [
    '在 24 小时内发送个性化产品介绍邮件',
    '安排 15 分钟电话了解具体需求',
    '准备相关行业案例研究',
    '提供产品演示或试用版本'
  ],
  recommendedApproach: '基于客户背景，建议强调 ROI 和数据安全性，提供灵活的订阅方案',
  potentialRisks: [
    '可能面临预算审批流程',
    '需要对比竞品功能'
  ],
  winProbability: '75%'
};

// AI 搜索结果 - 用于知识库搜索
export const mockAiSearchResults: (KnowledgeItem & { relevance: number; reason: string })[] = [
  {
    id: 1,
    title: '企业版产品功能介绍',
    type: 'Product Info',
    tags: ['产品', '企业版', '功能清单'],
    uploadDate: '2025-01-15',
    content: '企业版包含以下核心功能：智能客户管理、AI 销售助手、数据分析看板、自定义报表、API 集成、多级权限管理等。',
    relevance: 95,
    reason: '直接匹配企业版功能查询'
  },
  {
    id: 2,
    title: '某大型银行成功案例',
    type: 'Case Study',
    tags: ['金融', '成功案例', 'ROI'],
    uploadDate: '2025-01-10',
    content: '某大型银行使用我们的 CRM 系统后，销售效率提升 40%，客户转化率提高 35%，6 个月内实现投资回报率 280%。',
    relevance: 88,
    reason: '包含相关 ROI 数据和行业案例'
  },
  {
    id: 3,
    title: 'SaaS 行业销售指南',
    type: 'Product Info',
    tags: ['SaaS', '销售', '行业'],
    uploadDate: '2025-01-05',
    content: 'SaaS 行业销售要点：强调订阅价值、展示长期 ROI、提供试用、关注客户成功、建立持续服务关系。',
    relevance: 82,
    reason: '与 SaaS 销售策略高度相关'
  }
];

// 收入历史数据（包含收入和目标）
export const mockRevenueHistory = [
  { month: '8月', revenue: 180000, target: 200000 },
  { month: '9月', revenue: 220000, target: 210000 },
  { month: '10月', revenue: 195000, target: 220000 },
  { month: '11月', revenue: 280000, target: 240000 },
  { month: '12月', revenue: 320000, target: 260000 },
  { month: '1月', revenue: 350000, target: 280000 }
];

// 销售漏斗数据（包含颜色）
export const mockSalesFunnel = [
  { stage: '潜在客户', value: 450, count: 156, color: 'bg-blue-500' },
  { stage: '合格线索', value: 280, count: 89, color: 'bg-purple-500' },
  { stage: '方案阶段', value: 150, count: 45, color: 'bg-pink-500' },
  { stage: '谈判阶段', value: 95, count: 28, color: 'bg-orange-500' },
  { stage: '赢单', value: 62, count: 18, color: 'bg-emerald-500' }
];

// 管道风险分析（匹配 Dashboard 组件的期望）
export const mockPipelineRisks = [
  {
    id: 1,
    deal: 'Bob Johnson - BuildIt Corp',
    client: 'BuildIt Corp',
    value: '$120k',
    stage: 'Leads',
    riskLevel: 'High',
    reason: '客户已 3 周未回应，可能已选择竞品',
    aiAdvice: '建议立即电话跟进，了解真实情况和决策进度'
  },
  {
    id: 2,
    deal: 'Alice Smith - GreenLeaf Medical',
    client: 'GreenLeaf Medical',
    value: 'TBD',
    stage: 'Qualified',
    riskLevel: 'Medium',
    reason: '客户预算流程尚未明确，需要时间审批',
    aiAdvice: '协助准备详细的 ROI 分析报告，推动内部审批流程'
  },
  {
    id: 3,
    deal: 'Mike Wang - StartUp Inc',
    client: 'StartUp Inc',
    value: '$25k',
    stage: 'Qualified',
    riskLevel: 'Low',
    reason: '初创公司决策周期长，需要多方确认',
    aiAdvice: '提供灵活的试用方案，降低决策门槛，缩短决策时间'
  }
];

// 活动动态（别名，使用 mockActivities）
export const mockActivityFeed = mockActivities;

// 顶级交易（匹配 Dashboard 组件期望的字段）
export const mockTopDeals = [
  {
    id: 10005,
    name: 'Sarah Chen',
    client: 'Sarah Chen - CloudNine Tech',
    company: 'CloudNine Tech',
    value: '$200k',
    stage: 'Negotiation',
    probability: 85,
    nextStep: '准备合同草案',
    expectedClose: '2025-02-15'
  },
  {
    id: 10001,
    name: 'John Doe',
    client: 'John Doe - TechNova Solutions',
    company: 'TechNova Solutions',
    value: '$50k',
    stage: 'Negotiation',
    probability: 75,
    nextStep: '发送最终报价',
    expectedClose: '2025-02-01'
  },
  {
    id: 10004,
    name: '李明',
    client: '李明 - 华兴科技',
    company: '华兴科技',
    value: '¥30万',
    stage: 'Proposal',
    probability: 65,
    nextStep: '安排产品演示',
    expectedClose: '2025-02-20'
  }
];

// AI 洞察
export const mockAiInsights = {
  summary: '本月销售表现良好，管道价值增长 15%。建议重点关注 BuildIt Corp 项目的跟进。',
  risks: [
    {
      level: 'high',
      description: 'Bob Johnson 项目 3 周未跟进，存在流失风险'
    },
    {
      level: 'medium',
      description: 'Alice Smith 预算审批进度缓慢，需要推动'
    }
  ],
  recommendations: [
    '优先跟进高意向客户，提高转化率',
    '为低意向客户准备定制化方案，提升参与度',
    '加强与其他部门的协作，加速决策流程'
  ],
  nextBestActions: [
    {
      priority: 'high',
      action: '联系 Bob Johnson 了解项目状态',
      timeframe: '今天'
    },
    {
      priority: 'medium',
      action: '为 Alice Smith 准备 ROI 分析报告',
      timeframe: '本周'
    },
    {
      priority: 'low',
      action: '跟进 Mike Wang 的试用反馈',
      timeframe: '下周'
    }
  ]
};

