import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqeaivaznqkxdzigbfen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZWFpdmF6bnFreGR6aWdiZmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjIwMjksImV4cCI6MjA4MzI5ODAyOX0.kXOcObGAslX3s9lb04CgOU2B3dKYZ5ZhOZYEYzY7ock';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeLocation() {
    console.log('Removing location (city, country, club) from mock users...');

    const { data, error } = await supabase
        .from('users')
        .update({ city: null, country: null, club: null })
        .like('clerk_id', 'mock_%')
        .select('id, name, city, country, club');

    if (error) {
        console.error('Error updating users:', error);
    } else {
        console.log(`Successfully removed location for ${data.length} mock users.`);
    }
}

removeLocation();
