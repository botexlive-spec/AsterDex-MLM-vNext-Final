/**
 * Test what tree data is returned for user@finaster.com
 */
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function testUserTree() {
  try {
    console.log('🧪 Testing tree data for user@finaster.com...\n');

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'finaster_mlm',
    });

    console.log('✅ Connected to MySQL\n');

    // Get user@finaster.com details
    const [users] = await connection.query(
      'SELECT id, email, full_name FROM users WHERE email = ?',
      ['user@finaster.com']
    );

    if (!users || users.length === 0) {
      console.log('❌ User not found: user@finaster.com');
      await connection.end();
      return;
    }

    const user = users[0];
    console.log('👤 User found:', user.email, '(', user.id, ')');

    // Get their binary tree node
    const [btNodes] = await connection.query(
      `SELECT * FROM binary_tree WHERE user_id = ?`,
      [user.id]
    );

    if (!btNodes || btNodes.length === 0) {
      console.log('❌ No binary tree node found for this user');
      await connection.end();
      return;
    }

    const btNode = btNodes[0];
    console.log('\n📊 Binary Tree Node:');
    console.log('  Level:', btNode.level);
    console.log('  Position:', btNode.position);
    console.log('  Left child ID:', btNode.left_child_id || 'none');
    console.log('  Right child ID:', btNode.right_child_id || 'none');

    // Get left child details
    if (btNode.left_child_id) {
      const [leftChild] = await connection.query(
        'SELECT id, email, full_name FROM users WHERE id = ?',
        [btNode.left_child_id]
      );
      if (leftChild && leftChild.length > 0) {
        console.log('\n👶 Left child:', leftChild[0].email, '(', leftChild[0].full_name, ')');
      }
    }

    // Get right child details
    if (btNode.right_child_id) {
      const [rightChild] = await connection.query(
        'SELECT id, email, full_name FROM users WHERE id = ?',
        [btNode.right_child_id]
      );
      if (rightChild && rightChild.length > 0) {
        console.log('👶 Right child:', rightChild[0].email, '(', rightChild[0].full_name, ')');
      }
    }

    console.log('\n✅ Test complete!');
    console.log('\n💡 Expected tree structure for user@finaster.com:');
    console.log('   Root: user@finaster.com (John Doe)');
    console.log('   └─ Left: user657@asterdex.com (Test User Name)');
    console.log('   └─ Right: (empty)');
    console.log('\n   This should render as 2 nodes with 1 link - which matches the console output!');

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testUserTree();
