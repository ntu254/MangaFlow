const { createClient } = require('@supabase/supabase-js');

const url = 'https://isfuysxgebhuragazino.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnV5c3hnZWJodXJhZ2F6aW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDA4OTYsImV4cCI6MjA4NDI3Njg5Nn0.eDSRoE8O7ybl_W55Dm0m0-0e3FQNqxLz4pBlmfNQUi4';

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@redo.ai',
    password: 'Test123456!'
  });
  
  if (error) {
    console.error("SignUp Error:", error.message);
    process.exit(1);
  }
  
  console.log("User successfully created!");
  console.log("User ID:", data.user?.id);
}

main();
