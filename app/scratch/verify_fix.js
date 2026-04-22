import { useCallback } from 'react';

// Mocking the environment
const login = async (email, password) => {
    // This simulates the updated useAuth login function
    if (email === 'navadeepsripathi2@gmail.com') {
        return { id: '123', email, role: 'admin' };
    }
    return { id: '456', email, role: 'student' };
};

const testHandleLogin = async (email, password) => {
    let activeTab = 'dashboard';
    const setActiveTab = (tab) => { activeTab = tab; };
    
    try {
      const u = await login(email, password);
      console.log(`Login successful for ${email}. Returned role: ${u?.role}`);
      
      const isAdminEmail = email === 'admin@gmail.com' || email === 'navadeepsripathi2@gmail.com';
      
      if (u?.role === 'admin' || isAdminEmail) {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
      }
      
      console.log(`Final Active Tab: ${activeTab}`);
      return activeTab;
    } catch (error) {
      console.error('Login failed', error);
    }
};

async function runTests() {
    console.log('--- Testing Admin Login (Email Fallback) ---');
    const tab1 = await testHandleLogin('navadeepsripathi2@gmail.com', 'pass');
    if (tab1 === 'admin') console.log('PASS: Correctly redirected to admin');
    else console.error('FAIL: Did not redirect to admin');

    console.log('\n--- Testing Admin Login (Role Match) ---');
    const tab2 = await testHandleLogin('other-admin@test.com', 'pass');
    // Note: in the mock, other-admin returns 'student' role, so it should stay on dashboard 
    // unless we update the mock. Let's update the mock to return admin role for this test.
}

runTests();
