import { auth } from 'firebase-admin';
import { initializeApp, cert } from 'firebase-admin/app';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Firebase Admin SDK
if (!auth().app) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const createOrUpdateAdmin = async (email: string, password: string) => {
  try {
    console.log('Creating/updating admin account...');
    
    let firebaseUid: string;
    
    try {
      // Try to get existing user by email
      const existingUser = await auth().getUserByEmail(email);
      console.log('Found existing Firebase user, updating password...');
      
      // Update password
      await auth().updateUser(existingUser.uid, {
        password: password,
        emailVerified: true,
      });
      
      firebaseUid = existingUser.uid;
      console.log('Firebase user password updated successfully');
      
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist in Firebase, create new one
        console.log('Creating new Firebase user...');
        
        const newUser = await auth().createUser({
          email: email,
          password: password,
          displayName: 'Administrador Sistema',
          emailVerified: true,
        });
        
        firebaseUid = newUser.uid;
        console.log('Firebase user created successfully');
        
      } else {
        throw error;
      }
    }
    
    // Check if user exists in our database
    const existingDbUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (existingDbUser) {
      // Update existing database user
      console.log('Updating existing database user...');
      
      await db.update(users)
        .set({
          firebaseUid: firebaseUid,
          role: 'admin',
          displayName: 'Administrador Sistema',
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));
        
      console.log('Database user updated successfully');
      
    } else {
      // Create new database user
      console.log('Creating new database user...');
      
      await db.insert(users).values({
        firebaseUid: firebaseUid,
        email: email,
        displayName: 'Administrador Sistema',
        role: 'admin',
      });
      
      console.log('Database user created successfully');
    }
    
    console.log(`✅ Admin account ready: ${email}`);
    console.log('✅ Role: admin');
    console.log('✅ Can access all administrative functions');
    
    return { success: true, firebaseUid };
    
  } catch (error) {
    console.error('❌ Error creating/updating admin account:', error);
    throw error;
  }
};

// Export for use in server
export { createOrUpdateAdmin };

// Function to run the admin setup
export const runAdminSetup = async () => {
  const email = 'sistemas@anpr.org.mx';
  const password = 'sistemas123456789';
  
  try {
    await createOrUpdateAdmin(email, password);
    console.log('Admin account setup completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Failed to setup admin account:', error);
    return { success: false, error };
  }
};