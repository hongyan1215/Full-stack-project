import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, validateSignature, FlexMessage } from '@line/bot-sdk';
import dbConnect from '@/lib/db';
import { parseMessage, parseImage, generateIntelligentReply } from '@/lib/ai';
import { generatePieChartUrl } from '@/lib/chart';
import { 
  createTransactions, 
  getTransactionStats, 
  getTransactionList, 
  getTopExpense, 
  modifyTransaction, 
  bulkDeleteTransactions 
} from '@/lib/transaction';
import { setBudget, getBudgetStatus, checkBudgetAlert } from '@/lib/budget';
import { signMagicLinkToken } from '@/lib/auth';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

const client = new Client({
  channelAccessToken,
  channelSecret,
});

// Track processed image message IDs to prevent duplicate OCR processing
const processedImageIds = new Set<string>();
const IMAGE_ID_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up old image IDs periodically
setInterval(() => {
  // In a production environment, you might want to use Redis or a database
  // For now, we'll just clear the set periodically (this is a simple in-memory solution)
  if (processedImageIds.size > 1000) {
    processedImageIds.clear();
  }
}, 10 * 60 * 1000); // Every 10 minutes

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-line-signature');

  if (!signature || !validateSignature(body, channelSecret, signature)) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  const { events } = JSON.parse(body) as { events: WebhookEvent[] };

  await Promise.all(events.map(async (event) => {
    // Handle Message Events
    if (event.type === 'message') {
      const userId = event.source.userId;
      if (!userId) return;
      const replyToken = event.replyToken;

      try {
        await dbConnect();
        
        let aiResult;

        // 1. Handle Text Message
        if (event.message.type === 'text') {
          const userText = event.message.text;
          aiResult = await parseMessage(userText);
        } 
        // 2. Handle Image Message (OCR)
        else if (event.message.type === 'image') {
          // Check if this image has already been processed
          const imageId = event.message.id;
          if (processedImageIds.has(imageId)) {
            // Collect reply message and send once at the end
            await client.replyMessage(replyToken, { 
              type: 'text', 
              text: '這張圖片已經處理過了，不會重複記錄。' 
            });
            return;
          }

          // Get image content
          const stream = await client.getMessageContent(imageId);
          const buffers: Uint8Array[] = [];
          for await (const chunk of stream) {
            buffers.push(chunk);
          }
          const buffer = Buffer.concat(buffers);
          
          // Pass to AI
          aiResult = await parseImage(buffer, 'image/jpeg'); // Line images are typically JPEG
          
          // Mark this image as processed
          processedImageIds.add(imageId);
          
          // Remove from cache after TTL (simple timeout)
          setTimeout(() => {
            processedImageIds.delete(imageId);
          }, IMAGE_ID_CACHE_TTL);
        } else {
          // Ignore other message types
          return;
        }

        // 3. Handle Intent (Shared logic for both Text and Image)
        // Collect reply messages and send once at the end
        let replyMessages: Array<{ type: 'text'; text: string } | { type: 'image'; originalContentUrl: string; previewImageUrl: string }> = [];

        switch (aiResult.intent) {
          case 'RECORD':
            if (aiResult.transactions && aiResult.transactions.length > 0) {
              const { saved, duplicates } = await createTransactions(userId, aiResult.transactions);

              // Construct base reply message
              let replyText = '';
              if (saved.length > 0) {
                const summary = saved.map((t: any) => `${t.item} $${t.amount} (${t.category})`).join('\n');
                replyText += `已為您記下：\n${summary}`;

                // Check Budget Alerts for affected categories
                const affectedCategories = Array.from(new Set(saved.map((t: any) => t.category)));
                const alerts: string[] = [];
                
                for (const category of affectedCategories) {
                  const alert = await checkBudgetAlert(userId, category);
                  if (alert) alerts.push(alert);
                }
                
                if (alerts.length > 0) {
                   replyText += `\n\n${alerts.join('\n')}`;
                }

                // Only add AI insight if it's meaningful and not redundant
                // Only use insight if AI explicitly provided one (don't auto-generate)
                if (aiResult.insight && aiResult.insight.trim().length > 0) {
                  replyText += `\n\n${aiResult.insight}`;
                }
              }

              if (duplicates.length > 0) {
                if (replyText) replyText += '\n\n';
                replyText += `⚠️ 以下項目在最近5分鐘內已記錄過，已自動跳過：\n${duplicates.join('\n')}`;
              }

              if (saved.length === 0 && duplicates.length === 0) {
                 replyText = '抱歉，我無法識別有效的記帳內容。請確保包含項目與金額。';
              } else if (saved.length === 0 && duplicates.length > 0) {
                 replyText = '所有項目在最近5分鐘內都已記錄過，未重複記錄。';
              }

              replyMessages.push({ type: 'text', text: replyText });
            } else {
              replyMessages.push({ type: 'text', text: '抱歉，我不確定您想記什麼。' });
            }
            break;

          case 'QUERY':
            if (aiResult.query) {
              const stats = await getTransactionStats(userId, aiResult.query);
              
              if (stats.transactionCount === 0) {
                replyMessages.push({ type: 'text', text: '該時段沒有任何交易紀錄。' });
              } else {
                const chartData = {
                  labels: stats.breakdown.map(b => b._id),
                  data: stats.breakdown.map(b => b.total)
                };
                const chartUrl = await generatePieChartUrl(chartData, req.nextUrl.origin);
                
                let replyText = `📊 統計結果 (${aiResult.query.startDate.split('T')[0]} ~ ${aiResult.query.endDate.split('T')[0]})\n` +
                  `總支出: $${stats.totalExpense}\n` +
                  `總收入: $${stats.totalIncome}\n` +
                  `交易筆數: ${stats.transactionCount}\n\n` +
                  `前三大支出:\n` +
                  stats.breakdown.slice(0, 3).map(b => `- ${b._id}: $${b.total}`).join('\n');

                // Add AI-generated insight if available
                if (aiResult.insight) {
                  replyText += `\n\n${aiResult.insight}`;
                } else {
                  // Fallback: Generate intelligent reply
                  try {
                    const intelligentReply = await generateIntelligentReply('QUERY', { stats });
                    if (intelligentReply) {
                      replyText += `\n\n${intelligentReply}`;
                    }
                  } catch (error) {
                    console.error('Failed to generate intelligent reply for QUERY:', error);
                    // Continue with base reply
                  }
                }

                replyMessages.push({ type: 'text', text: replyText });
                
                // Add chart image if available
                if (chartUrl) {
                  replyMessages.push({ 
                    type: 'image', 
                    originalContentUrl: chartUrl, 
                    previewImageUrl: chartUrl 
                  });
                }
              }
            }
            break;

          case 'LIST_TRANSACTIONS':
            if (aiResult.query) {
              const transactions = await getTransactionList(userId, aiResult.query);
              if (transactions.length === 0) {
                replyMessages.push({ type: 'text', text: '該時段沒有任何交易紀錄。' });
              } else {
                const listText = transactions.map(t => {
                  const dateStr = new Date(t.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
                  return `${dateStr} ${t.item} $${t.amount} (${t.category})`;
                }).join('\n');
                
                let replyText = `📋 交易明細 (最近20筆):\n${listText}`;
                
                // Add AI-generated insight if available
                if (aiResult.insight) {
                  replyText += `\n\n${aiResult.insight}`;
                } else {
                  // Fallback: Generate intelligent summary
                  try {
                    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                    const intelligentReply = await generateIntelligentReply('LIST_TRANSACTIONS', {
                      transactionList: transactions,
                      stats: {
                        totalExpense,
                        totalIncome,
                        breakdown: [],
                        transactionCount: transactions.length
                      }
                    });
                    if (intelligentReply) {
                      replyText += `\n\n${intelligentReply}`;
                    }
                  } catch (error) {
                    console.error('Failed to generate intelligent reply for LIST_TRANSACTIONS:', error);
                    // Continue with base reply
                  }
                }
                
                replyMessages.push({ type: 'text', text: replyText });
              }
            }
            break;

          case 'TOP_EXPENSE':
            if (aiResult.query) {
              const topStats = await getTopExpense(userId, aiResult.query);
              
              if (!topStats.topCategory && !topStats.topItem) {
                replyMessages.push({ type: 'text', text: '該時段沒有支出紀錄。' });
              } else {
                let reply = `🔥 消費之最 (${aiResult.query.startDate.split('T')[0]} ~ ${aiResult.query.endDate.split('T')[0]})\n\n`;
                
                if (topStats.topCategory) {
                  reply += `🏆 花費最多的種類: ${topStats.topCategory.category} (共 $${topStats.topCategory.total})\n`;
                }
                if (topStats.topItem) {
                  const dateStr = new Date(topStats.topItem.date).toLocaleDateString('zh-TW');
                  reply += `💸 最大筆單次支出: ${topStats.topItem.item} $${topStats.topItem.amount} (${dateStr})`;
                }

                // Add AI-generated insight if available
                if (aiResult.insight) {
                  reply += `\n\n${aiResult.insight}`;
                } else {
                  // Fallback: Generate intelligent analysis
                  try {
                    const intelligentReply = await generateIntelligentReply('TOP_EXPENSE', { topExpense: topStats });
                    if (intelligentReply) {
                      reply += `\n\n${intelligentReply}`;
                    }
                  } catch (error) {
                    console.error('Failed to generate intelligent reply for TOP_EXPENSE:', error);
                    // Continue with base reply
                  }
                }
                
                replyMessages.push({ type: 'text', text: reply });
              }
            }
            break;
          
          case 'SET_BUDGET':
            if (aiResult.budget) {
              const { category, amount } = aiResult.budget;
              await setBudget(userId, category, amount);
              replyMessages.push({ 
                type: 'text', 
                text: `✅ 已設定預算：\n${category === 'Total' ? '總預算' : category} -> $${amount}/月` 
              });
            } else {
               replyMessages.push({ type: 'text', text: '抱歉，我沒聽清楚您想設定哪個種類的預算。請再試一次，例如：「設定餐飲預算5000」。' });
            }
            break;

          case 'CHECK_BUDGET':
            const budgetStatus = await getBudgetStatus(userId);
            if (budgetStatus.length === 0) {
              replyMessages.push({ type: 'text', text: '您目前沒有設定任何預算。您可以說「設定總預算 20000」來開始使用預算功能。' });
            } else {
              let statusText = '📉 本月預算使用狀況：\n\n';
              
              for (const b of budgetStatus) {
                const categoryName = b.category === 'Total' ? '總預算' : b.category;
                const icon = b.isOverBudget ? '⚠️' : (b.percentage >= 80 ? '🚨' : '✅');
                statusText += `${icon} ${categoryName}: $${b.spent} / $${b.limit} (${b.percentage}%)\n`;
                if (b.isOverBudget) {
                  statusText += `   已超支 $${Math.abs(b.remaining)}\n`;
                } else {
                  statusText += `   還剩 $${b.remaining}\n`;
                }
                statusText += '\n';
              }
              replyMessages.push({ type: 'text', text: statusText.trim() });
            }
            break;

          case 'DASHBOARD':
            const token = await signMagicLinkToken(userId);
            // The appOrigin is needed. We can use req.nextUrl.origin
            const dashboardUrl = `${req.nextUrl.origin}/auth/callback?token=${token}`;
            
            replyMessages.push({
              type: 'text',
              text: `🖥️ 請點擊以下連結進入後台 (連結 15 分鐘內有效)：\n${dashboardUrl}`,
            });
            break;

          case 'DELETE':
          case 'MODIFY':
            if (aiResult.modification) {
              const resultMsg = await modifyTransaction(userId, aiResult.modification);
              replyMessages.push({ type: 'text', text: resultMsg });
            }
            break;

          case 'BULK_DELETE':
            if (aiResult.query) {
              const resultMsg = await bulkDeleteTransactions(userId, aiResult.query);
              replyMessages.push({ type: 'text', text: resultMsg });
            }
            break;

          case 'HELP':
            replyMessages.push({
              type: 'text',
              text: `🤖 我是您的 AI 記帳助手，我可以幫您：

1. 📝 記帳
   - "午餐吃牛肉麵 150"
   - "昨天買飲料 50"
   - 📸 傳送發票照片

2. 💰 預算管理
   - "設定總預算 20000"
   - "設定餐飲預算 5000"
   - "預算剩多少"

3. 📊 查詢統計
   - "這個月花了多少？"
   - "上週飲食支出"

4. 🖥️ 網頁後台 (New!)
   - "Dashboard"
   - "後台"
   - 查看與編輯詳細資料

5. 🧾 進階查詢
   - "列出上週的所有支出"
   - "上個月花最多的是什麼？"

6. 🔧 修改與刪除
   - "刪除上一筆"
   - "Undo"
   - "刪除昨天所有交易"

7. 🏷️ 查詢分類
   - "有哪些分類？"

直接跟我聊天即可，我會自動理解您的意思！`,
            });
            break;

          case 'CATEGORY_LIST':
            replyMessages.push({
              type: 'text',
              text: `📋 支援的自動分類項目：

1. 🍔 Food (餐飲)
2. 🚌 Transport (交通)
3. 🎬 Entertainment (娛樂)
4. 🛍️ Shopping (購物)
5. 🧾 Bills (帳單/繳費)
6. 💰 Salary (薪水/收入)
7. 📦 Other (其他)

💡 記帳時您不需手動指定，AI 會自動判斷！`,
            });
            break;

          case 'SMALL_TALK':
            if (aiResult.message) {
              replyMessages.push({
                type: 'text',
                text: aiResult.message,
              });
            } else {
              replyMessages.push({
                type: 'text',
                text: '你好！我是您的 AI 記帳助手，很高興為您服務！',
              });
            }
            break;

          case 'UNKNOWN':
          default:
            replyMessages.push({
              type: 'text',
              text: '抱歉，我不確定您的意思。您可以試著問我：「你有哪些功能？」或直接說：「午餐100」。\n\n💡 您也可以直接傳送發票照片給我！',
            });
            break;
        }

        // Send all reply messages once at the end
        if (replyMessages.length > 0) {
          if (replyMessages.length === 1) {
            await client.replyMessage(replyToken, replyMessages[0]);
          } else {
            await client.replyMessage(replyToken, replyMessages);
          }
        }

      } catch (error) {
        console.error('Error processing event:', error);
        // Do not send reply in catch block
      }
    }
  }));

  return NextResponse.json({ status: 'ok' });
}
