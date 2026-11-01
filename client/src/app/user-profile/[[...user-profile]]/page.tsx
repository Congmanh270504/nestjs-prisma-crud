import { UserProfile } from "@clerk/nextjs";
import { Suspense } from "react";

const UserProfilePage = () => (
  <Suspense>
    <div className="flex h-screen w-full items-center justify-center">
      <UserProfile />
    </div>
  </Suspense>
);

export default UserProfilePage;
