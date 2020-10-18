import { Bridge } from 'matrix-appservice-bridge';
import UserRepository from '../repositories/UserRepository';
import logger from '../util/logger';

export default class PrivateRoomCollection {
  public constructor(
    private userRepository: UserRepository,
    private bridge: Bridge,
  ) {
  }

  public async getPrivateRoom(userId: string): Promise<string> {
    const user = await this.userRepository.find(userId);

    if (user && user.private_room_id) {
      let members: Record<string, unknown> | undefined;
      try {
        members = await this.bridge.getBot().getJoinedMembers(user.private_room_id);
      } catch (error) {
        logger.warn(
          `User ${user.id} has ${user.private_room_id} as their private room, `
          + 'but I am not a member of it. A new private room will be created.',
        );
      }
      if (members) {
        if (!members[userId]) {
          logger.debug(
            `User ${user.id} is not a member of their private room anymore/yet, `
            + 'resending invite.',
          );
          this.bridge.getIntent().invite(user.private_room_id, userId);
        }
        return user.private_room_id;
      }
    }

    const privateRoom = await this.createPrivateRoom(userId);
    await this.userRepository.addOrUpdate({
      id: userId,
      private_room_id: privateRoom,
    });

    logger.debug(`Created private room ${privateRoom} for ${userId}`);
    return privateRoom;
  }

  private async createPrivateRoom(userId: string): Promise<string> {
    const result = await this.bridge.getIntent().createRoom({
      // Use the bot user to create the room
      createAsClient: false,
      options: {
        invite: [userId],
        // Allow clients to consider the room as a direct message
        is_direct: true,
        // This creates the room without an initial power_levels state event
        preset: 'private_chat',
        // Exclude the room from the public room list
        visibility: 'private',
        initial_state: [{
          type: 'm.room.power_levels',
          content: {
            users: {
              // Grant the bot user power level 100. All other users will have
              // a power level of 0, so they won't be able to invite other users
              // to this room.
              [this.bridge.getBot().getUserId()]: 100,
            },
          },
          state_key: '',
        }],
      },
    });
    return result.room_id;
  }
}
