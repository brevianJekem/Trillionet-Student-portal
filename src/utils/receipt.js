export function openReceipt({ studentName, regNo, payment }) {
  const date = new Date(payment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt — ${regNo}</title>
<style>
  body { font-family: -apple-system, Inter, sans-serif; max-width: 480px; margin: 40px auto; color: #1D1D1F; }
  .header { text-align: center; margin-bottom: 32px; }
  .header h1 { font-size: 18px; margin: 0 0 4px; }
  .header p { font-size: 12px; color: #6E6E73; margin: 0; }
  .receipt-title { text-align: center; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #052659; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; }
  .row .label { color: #6E6E73; }
  .row .value { font-weight: 500; }
  .amount { text-align: center; margin: 28px 0; }
  .amount .num { font-size: 32px; font-weight: 700; color: #052659; }
  .amount .lbl { font-size: 11px; color: #6E6E73; text-transform: uppercase; letter-spacing: 0.04em; }
  .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #A1A1A6; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Trillionet Computer Training Center</h1>
    <p>Official Payment Receipt</p>
  </div>
  <div class="receipt-title">Payment Confirmation</div>
  <div class="amount">
    <div class="num">KSh ${payment.amount.toLocaleString()}</div>
    <div class="lbl">Amount Paid</div>
  </div>
  <div class="row"><span class="label">Student</span><span class="value">${studentName}</span></div>
  <div class="row"><span class="label">Admission No.</span><span class="value">${regNo}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
  <div class="row"><span class="label">Method</span><span class="value">${payment.method.toUpperCase()}</span></div>
  ${payment.transactionCode ? `<div class="row"><span class="label">Transaction code</span><span class="value">${payment.transactionCode}</span></div>` : ''}
  <div class="row"><span class="label">Receipt ID</span><span class="value">${payment.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="footer">This is a system-generated receipt. Keep it for your records.</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}