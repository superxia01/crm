/**
 * API Configuration and Utilities for Volcano Engine DeepSeek
 */

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text: string }>;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Call Volcano Engine DeepSeek API
 * @endpoint: https://ark.cn-beijing.volces.com/api/v3/responses
 * @docs: https://www.volcengine.com/docs/82379/1263481
 */
export async function callDeepSeekAPI(
  messages: DeepSeekMessage[],
  stream: boolean = false
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const endpoint = 'https://ark.cn-beijing.volces.com/api/v3/responses';

  // 转换消息格式为火山引擎格式
  const input = messages.map(msg => {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        content: [
          {
            type: 'input_text',
            text: msg.content
          }
        ]
      };
    }
    return {
      role: msg.role,
      content: msg.content
    };
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL_ID || 'deepseek-v3-2-251201',
        stream,
        input
      })
    });

    if (!response.ok) {
      const errorData: DeepSeekError = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    // 处理流式响应
    if (stream) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.output?.[0]?.content?.[0]?.text;
              if (content) fullText += content;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullText;
    }

    // 非流式响应
    const data = await response.json();
    return data.output?.[0]?.content?.[0]?.text || '';
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
}

/**
 * Generate sales script based on customer context
 */
export async function generateSalesScript(
  customerName: string,
  company: string,
  industry: string,
  position: string,
  concerns: string[],
  customPrompt?: string
): Promise<string> {
  const systemPrompt: DeepSeekMessage = {
    role: 'system',
    content: `你是一位资深的销售顾问和话术专家。你擅长根据客户背景和痛点，生成个性化的销售话术。

请根据客户提供的信息，生成专业的销售话术，要求：
1. 针对客户的具体痛点和关注点
2. 体现专业性，但避免过于技术化
3. 强调产品价值和 ROI
4. 包含具体的行动号召
5. 语气友好、专业、有说服力`
  };

  const userPrompt: DeepSeekMessage = {
    role: 'user',
    content: `请为以下客户生成销售话术：

客户信息：
- 姓名：${customerName}
- 公司：${company}
- 行业：${industry}
- 职位：${position}
- 主要关注点：${concerns.join('、')}

${customPrompt ? `特殊要求：${customPrompt}` : '请生成一个包含开场、价值主张和行动号召的完整话术。'}`
  };

  const response = await callDeepSeekAPI([systemPrompt, userPrompt]);
  return response;
}

/**
 * Analyze customer intent and provide insights
 */
export async function analyzeCustomerIntent(
  customerInfo: {
    name: string;
    company: string;
    industry: string;
    stage: string;
    budget: string;
  }
): Promise<{
  intentLevel: 'High' | 'Medium' | 'Low';
  insights: string[];
  recommendations: string[];
}> {
  const systemPrompt: DeepSeekMessage = {
    role: 'system',
    content: `你是一位资深的销售分析师。你需要根据客户信息分析其购买意向，并提供洞察和建议。

请从以下维度分析：
1. 客户意向程度（High/Medium/Low）
2. 关键洞察（2-3条）
3. 行动建议（2-3条）

请以 JSON 格式返回：
{
  "intentLevel": "High|Medium|Low",
  "insights": ["洞察1", "洞察2", "洞察3"],
  "recommendations": ["建议1", "建议2", "建议3"]
}`
  };

  const userPrompt: DeepSeekMessage = {
    role: 'user',
    content: `请分析以下客户：

- 姓名：${customerInfo.name}
- 公司：${customerInfo.company}
- 行业：${customerInfo.industry}
- 销售阶段：${customerInfo.stage}
- 预算：${customerInfo.budget}`
  };

  const response = await callDeepSeekAPI([systemPrompt, userPrompt]);

  try {
    // 尝试解析 JSON 响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // 如果无法解析，返回默认值
    return {
      intentLevel: 'Medium',
      insights: [response.substring(0, 200)],
      recommendations: ['建议继续跟进']
    };
  } catch {
    return {
      intentLevel: 'Medium',
      insights: ['AI 分析结果解析失败'],
      recommendations: ['请人工分析客户情况']
    };
  }
}

/**
 * Semantic search for knowledge base
 */
export async function semanticSearch(
  query: string,
  knowledgeItems: Array<{ title: string; content: string; tags: string[] }>
): Promise<Array<typeof knowledgeItems[0] & { relevance: number }>> {
  const systemPrompt: DeepSeekMessage = {
    role: 'system',
    content: `你是一个智能知识库搜索助手。根据用户的查询，从知识库中找出最相关的文档。

请返回 JSON 数组，每个元素包含：
- title: 文档标题
- relevance: 相关度分数（0-100）
- reason: 匹配原因（简短说明）

格式：
[
  {"title": "文档标题", "relevance": 95, "reason": "匹配原因"},
  ...
]`
  };

  const knowledgeContext = knowledgeItems
    .map((item, idx) => `${idx + 1}. ${item.title}\n   标签: ${item.tags.join(', ')}\n   内容: ${item.content?.substring(0, 200)}...`)
    .join('\n\n');

  const userPrompt: DeepSeekMessage = {
    role: 'user',
    content: `查询: ${query}

知识库文档：
${knowledgeContext}

请找出最相关的 3-5 个文档。`
  };

  const response = await callDeepSeekAPI([systemPrompt, userPrompt]);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const results = JSON.parse(jsonMatch[0]);
      return results.map((result: any) => {
        const originalItem = knowledgeItems.find(item => item.title === result.title);
        return originalItem ? { ...originalItem, relevance: result.relevance } : null;
      }).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Generate tags for knowledge base documents
 */
export async function generateTags(title: string, content: string): Promise<string[]> {
  const systemPrompt: DeepSeekMessage = {
    role: 'system',
    content: `你是一个智能标签生成助手。根据文档标题和内容，生成 3-5 个相关标签。

标签要求：
1. 简洁明了（2-4个字）
2. 能反映文档核心内容
3. 常用的业务术语

请只返回标签数组，用逗号分隔。例如：产品, 销售, 策略`
  };

  const userPrompt: DeepSeekMessage = {
    role: 'user',
    content: `标题: ${title}
内容: ${content.substring(0, 500)}`
  };

  const response = await callDeepSeekAPI([systemPrompt, userPrompt]);
  return response
    .split(/[,，、\n]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length < 10)
    .slice(0, 5);
}
