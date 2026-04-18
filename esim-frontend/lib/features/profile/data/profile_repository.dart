import 'package:esim_frontend/features/profile/data/dto/user_profile_dto.dart';
import 'package:esim_frontend/features/profile/data/profile_datasource.dart';
import 'package:esim_frontend/features/profile/models/change_password_request.dart';
import 'package:esim_frontend/features/profile/models/update_profile_request.dart';
import 'package:esim_frontend/features/profile/models/user_profile.dart';

class ProfileRepository {
  const ProfileRepository(this._datasource);

  final ProfileDatasource _datasource;

  Future<UserProfile> getProfile() async {
    final raw = await _datasource.getProfile();
    return UserProfileDto.fromJson(raw).toDomain();
  }

  Future<UserProfile> updateProfile(UpdateProfileRequest request) async {
    final raw = await _datasource.updateProfile(request.toJson());
    return UserProfileDto.fromJson(raw).toDomain();
  }

  Future<void> changePassword(ChangePasswordRequest request) async {
    await _datasource.changePassword(request.toJson());
  }
}
