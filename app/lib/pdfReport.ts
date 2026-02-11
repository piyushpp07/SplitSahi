import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface ReportData {
    groupName: string;
    totalExpenses: string;
    members: Array<{ name: string; email: string }>;
    expenses: Array<{ title: string; category: string; amount: string; date: string; creator: string }>;
}

export async function generateGroupPDF(data: ReportData) {
    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
          .group-name { font-size: 28px; font-weight: bold; color: #0ea5e9; margin-bottom: 5px; }
          .summary { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; borderRadius: 8px; }
          .summary-item { text-align: center; flex: 1; }
          .summary-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
          .summary-value { font-size: 18px; font-weight: bold; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px; background-color: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .amount { font-weight: bold; color: #0f172a; text-align: right; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
          .chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; background: #e0f2fe; color: #0369a1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="group-name">${data.groupName}</div>
          <div style="font-size: 14px; color: #64748b;">Expense Report • ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Spent</div>
            <div class="summary-value">₹${data.totalExpenses}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Transactions</div>
            <div class="summary-value">${data.expenses.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Members</div>
            <div class="summary-value">${data.members.length}</div>
          </div>
        </div>

        <h3 style="font-size: 16px; margin-bottom: 10px;">Expense History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Paid By</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.expenses.map(exp => `
              <tr>
                <td>${exp.date}</td>
                <td>
                  <div style="font-weight: bold;">${exp.title}</div>
                  <span class="chip">${exp.category}</span>
                </td>
                <td>${exp.creator}</td>
                <td class="amount">₹${exp.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated via SplitItUp - Smart Expense Manager
        </div>
      </body>
    </html>
  `;

    try {
        const { uri } = await Print.printToFileAsync({ html });
        console.log('File has been saved to:', uri);

        if (Platform.OS === 'ios') {
            await Sharing.shareAsync(uri);
        } else {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `SplitItUp - ${data.groupName} Report`,
                UTI: 'com.adobe.pdf'
            });
        }
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        throw error;
    }
}
