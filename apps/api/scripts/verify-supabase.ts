import 'dotenv/config';
import { supabase } from '../src/clients/supabase.js';

async function main() {
  console.log('Inserting a test recommendation...');

  const { data: inserted, error: insertError } = await supabase
    .from('recommendations')
    .insert({
      user_id: 'jacky',
      cuisine: '中餐',
      servings: 2,
      dietary: [],
      result: {
        status: 'success',
        courses: [{ name: '测试菜' }],
      },
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert failed:', insertError);
    process.exit(1);
  }

  console.log('✅ Inserted:', inserted);

  const { data: rows, error: selectError } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', 'jacky');

  if (selectError) {
    console.error('❌ Select failed:', selectError);
    process.exit(1);
  }

  console.log(`✅ Found ${rows.length} recommendations for jacky:`);
  console.log(JSON.stringify(rows, null, 2));
}

main();