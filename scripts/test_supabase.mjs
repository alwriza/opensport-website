import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqeaivaznqkxdzigbfen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZWFpdmF6bnFreGR6aWdiZmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjIwMjksImV4cCI6MjA4MzI5ODAyOX0.kXOcObGAslX3s9lb04CgOU2B3dKYZ5ZhOZYEYzY7ock';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Fetching global rankings count...');
    const { count, error } = await supabase
        .from('global_rankings')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error fetching global rankings:', error);
        return;
    }

    console.log('Total players in global rankings:', count);

    console.log('Fetching top 3 players...');
    const { data: topPlayers } = await supabase
        .from('global_rankings')
        .select('*')
        .order('best_score', { ascending: false })
        .limit(3);

    console.log('Top 3 players:', topPlayers);
}

test();
