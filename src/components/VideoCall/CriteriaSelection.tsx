'use client';

import React from 'react';
import type { UserProfile } from '@/types/auth';

interface CriteriaSelectionProps {
  userProfile: UserProfile | null;
}

export const CriteriaSelection: React.FC<CriteriaSelectionProps> = ({ userProfile }) => {
  if (!userProfile) return null;

  return (
    <section className="criteria-selection">
      <div className="criteria-tab">Preferred Language Partner</div>
      <form>
        <div className="form-row">
          <label htmlFor="native-language">Native Language</label>
          <select id="native-language" name="native-language" defaultValue={userProfile.native_language}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="zh">Chinese</option>
            <option value="ru">Russian</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="target-language">Target Language</label>
          <select id="target-language" name="target-language" defaultValue={userProfile.target_languages[0]}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="zh">Chinese</option>
            <option value="ru">Russian</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="age">Age</label>
          <select id="age" name="age" defaultValue={getAgeRange(userProfile.age)}>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55+">55+</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="gender">Gender</label>
          <select id="gender" name="gender" defaultValue={userProfile.gender || 'any'}>
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="proficiency">Proficiency Level</label>
          <select id="proficiency" name="proficiency" defaultValue="intermediate">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="native">Native</option>
          </select>
        </div>
      </form>
    </section>
  );
};

function getAgeRange(age: number): string {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
}