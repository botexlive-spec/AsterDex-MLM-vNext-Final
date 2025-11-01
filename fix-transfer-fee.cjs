const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'pages', 'user', 'WalletNew.tsx');

console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add transferAmount state after transferFee state (line 103)
const transferFeeStateLine = `  const [transferFee, setTransferFee] = useState(0);`;
const newStates = `  const [transferFee, setTransferFee] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');`;

content = content.replace(transferFeeStateLine, newStates);
console.log('✓ Added transferAmount state');

// Step 2: Replace the amount Input component to add onChange and value
const oldAmountInput = `                <div>
                  <Input
                    label="Amount *"
                    type="number"
                    placeholder="Enter transfer amount"
                    min="1"
                  />
                  <p className="text-sm text-[#94a3b8] mt-1">Available: $\{balance.available.toFixed(2)}</p>
                </div>`;

const newAmountInput = `                <div>
                  <Input
                    label="Amount *"
                    type="number"
                    placeholder="Enter transfer amount"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => {
                      const amount = e.target.value;
                      setTransferAmount(amount);
                      const numAmount = parseFloat(amount || '0');
                      const fee = numAmount * 0.01; // 1% fee
                      setTransferFee(fee);
                    }}
                  />
                  <p className="text-sm text-[#94a3b8] mt-1">Available: $\{balance.available.toFixed(2)}</p>
                </div>`;

content = content.replace(oldAmountInput, newAmountInput);
console.log('✓ Added onChange handler to amount input');

// Step 3: Replace hardcoded fee display with calculated values
const oldFeeDisplay = `                <div className="p-4 bg-[#334155] rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#cbd5e1]">Transfer Amount</span>
                    <span className="text-[#f8fafc]">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#cbd5e1]">Transfer Fee (1%)</span>
                    <span className="text-[#f8fafc]">$0.00</span>
                  </div>
                  <div className="border-t border-[#475569] pt-2 flex justify-between">
                    <span className="text-[#f8fafc] font-bold">Recipient Receives</span>
                    <span className="text-[#10b981] font-bold text-lg">$0.00</span>
                  </div>
                </div>`;

const newFeeDisplay = `                <div className="p-4 bg-[#334155] rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#cbd5e1]">Transfer Amount</span>
                    <span className="text-[#f8fafc]">$\{parseFloat(transferAmount || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#cbd5e1]">Transfer Fee (1%)</span>
                    <span className="text-[#f8fafc]">$\{transferFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#475569] pt-2 flex justify-between">
                    <span className="text-[#f8fafc] font-bold">Recipient Receives</span>
                    <span className="text-[#10b981] font-bold text-lg">$\{(parseFloat(transferAmount || '0') - transferFee).toFixed(2)}</span>
                  </div>
                </div>`;

content = content.replace(oldFeeDisplay, newFeeDisplay);
console.log('✓ Updated fee display with calculated values');

// Write the modified content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ File updated successfully!');
console.log('\nChanges made:');
console.log('1. Added transferAmount state (line 104)');
console.log('2. Added onChange handler to amount input with fee calculation');
console.log('3. Updated fee display to show real-time calculated values');
