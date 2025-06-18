import { withAuthenticatedAPI, createSuccessResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { User } from '@/lib/database/models';

export const POST = withAuthenticatedAPI(async ({ user }: AuthenticatedRequest) => {
  // Update lastActivity for navigation tracking
  await User.findByIdAndUpdate(user.id, {
    lastActivity: new Date(),
  });

  return createSuccessResponse({});
});
