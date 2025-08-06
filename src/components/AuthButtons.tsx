'use client';
import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, provider } from '../../firebase/firebaseConfig';

export default function AuthButtons() {

  const [user, setUser] = useState<User | null>(null) // Either user is logged in or no one is

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { setUser(user); }); // Tracks login/logout and updates state 
    return () => unsubscribe();
  }, [])

  return (

    <div>
      {user ? (
        <div>
          <p> Welcome {user.displayName} </p>
          <button onClick={() => signOut(auth)}> Sign out</button>
        </div>
      ) : (
        <button onClick={() => signInWithPopup(auth, provider)}>Sign in with Google</button>
      )}
    </div>

  );
}