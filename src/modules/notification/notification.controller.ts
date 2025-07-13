import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User } from "../../database/schemas/user.schema";
import { AuthUser } from "../../decorators/user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GetNotificationsDto } from "./notification.dto";
import { NotificationService } from "./notification.service";

@Controller()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true }))
@ApiTags("Notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @AuthUser() user: User,
    @Query() query: GetNotificationsDto,
  ) {
    return {
      data: await this.notificationService.getUserNotifications(
        user._id.toString(),
        query,
      ),
      message: "Notifications fetched successfully",
    };
  }

  @Get("unread-count")
  async getUnreadCount(@AuthUser() user: User) {
    const count = await this.notificationService.getUnreadCount(
      user._id.toString(),
    );
    return { data: count, message: "Unread count fetched successfully" };
  }

  @Patch(":id/read")
  async markAsRead(
    @Param("id") notificationId: string,
    @AuthUser() user: User,
  ) {
    return {
      data: await this.notificationService.markAsRead(
        notificationId,
        user._id.toString(),
      ),
      message: "Notification marked as read successfully",
    };
  }

  @Patch("mark-all-read")
  async markAllAsRead(@AuthUser() user: User) {
    return {
      data: await this.notificationService.markAllAsRead(user._id.toString()),
      message: "All notifications marked as read successfully",
    };
  }

  @Delete(":id")
  async deleteNotification(
    @Param("id") notificationId: string,
    @AuthUser() user: User,
  ) {
    await this.notificationService.deleteNotification(
      notificationId,
      user._id.toString(),
    );
    return { message: "Notification deleted successfully" };
  }
}
