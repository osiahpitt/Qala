'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export const ProfileButton: React.FC = () => {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/profile/edit');
  };

  return (
    <button
      className="profile-btn"
      type="button"
      onClick={handleProfileClick}
    >
      Profile
    </button>
  );
};