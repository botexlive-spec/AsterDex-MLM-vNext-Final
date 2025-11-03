import { readFileSync, writeFileSync } from 'fs';

const file = 'app/pages/user/TeamNew.tsx';
let content = readFileSync(file, 'utf8');

// Find the table section and replace with ResponsiveTable
const tableStartMarker = "              {/* Table */}\n              <div className=\"overflow-x-auto\">";
const tableEndMarker = "              </div>\n            </div>\n          </Card>\n        ) : (";

if (content.includes(tableStartMarker) && content.includes(tableEndMarker)) {
  const startIdx = content.indexOf(tableStartMarker);
  const endIdx = content.indexOf(tableEndMarker, startIdx);

  if (startIdx !== -1 && endIdx !== -1) {
    const newTable = `              {/* Table - Responsive */}
              <ResponsiveTable
                columns={[
                  {
                    key: 'name',
                    label: 'Member',
                    mobileLabel: 'Name',
                    render: (value, row) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C7D1] to-[#00e5f0] flex items-center justify-center text-white font-semibold shrink-0">
                          {row.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#f8fafc] font-medium truncate">{row.name}</p>
                          <p className="text-sm text-[#94a3b8] truncate">{row.email}</p>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'level',
                    label: 'Level',
                    render: (value) => (
                      <Badge variant="info">L{value}</Badge>
                    )
                  },
                  {
                    key: 'joinDate',
                    label: 'Join Date',
                    mobileLabel: 'Joined',
                    render: (value) => new Date(value).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (value) => (
                      <Badge variant={value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'error'}>
                        {value}
                      </Badge>
                    )
                  },
                  {
                    key: 'totalInvestment',
                    label: 'Investment',
                    render: (value) => \`$\${value.toLocaleString()}\`
                  },
                  {
                    key: 'teamSize',
                    label: 'Team Size',
                    mobileLabel: 'Team',
                  },
                  {
                    key: 'volume',
                    label: 'Volume',
                    render: (value) => \`$\${value.toLocaleString()}\`
                  }
                ]}
                data={filteredMembers}
                keyField="id"
                emptyMessage="No team members found"
              />`;

    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);

    content = before + newTable + '\n' + after;

    writeFileSync(file, content);
    console.log('✅ Successfully replaced HTML table with ResponsiveTable component');
  } else {
    console.log('❌ Could not find table start or end markers');
  }
} else {
  console.log('❌ Could not find table section markers');
}
