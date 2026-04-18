import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/providers/core_providers.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/profile/data/profile_datasource.dart';
import 'package:esim_frontend/features/profile/data/profile_repository.dart';
import 'package:esim_frontend/features/profile/models/change_password_request.dart';
import 'package:esim_frontend/features/profile/models/update_profile_request.dart';
import 'package:esim_frontend/features/profile/models/user_profile.dart';

// ── Infrastructure ─────────────────────────────────────────────────────────

final profileDatasourceProvider = Provider<ProfileDatasource>((ref) {
  return ProfileDatasource(ref.read(dioProvider));
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.read(profileDatasourceProvider));
});

// ── Data providers ─────────────────────────────────────────────────────────

final userProfileProvider = FutureProvider<UserProfile>((ref) {
  return ref.read(profileRepositoryProvider).getProfile();
});

// ── Action state ───────────────────────────────────────────────────────────

sealed class ProfileActionState {}

class ProfileActionInitial extends ProfileActionState {}

class ProfileActionLoading extends ProfileActionState {}

class ProfileActionSuccess extends ProfileActionState {
  ProfileActionSuccess(this.message);
  final String message;
}

class ProfileActionError extends ProfileActionState {
  ProfileActionError(this.message);
  final String message;
}

// ── Action notifier ────────────────────────────────────────────────────────

class ProfileActionNotifier extends StateNotifier<ProfileActionState> {
  ProfileActionNotifier(this._repository, this._ref)
      : super(ProfileActionInitial());

  final ProfileRepository _repository;
  final Ref _ref;

  Future<void> updateProfile(UpdateProfileRequest request) async {
    state = ProfileActionLoading();
    try {
      await _repository.updateProfile(request);
      _ref.invalidate(userProfileProvider);
      _ref.invalidate(authProvider);
      state = ProfileActionSuccess('Profil mis à jour avec succès.');
    } catch (e) {
      state = ProfileActionError(e.toString());
    }
  }

  Future<void> changePassword(ChangePasswordRequest request) async {
    state = ProfileActionLoading();
    try {
      await _repository.changePassword(request);
      state = ProfileActionSuccess('Mot de passe modifié avec succès.');
    } catch (e) {
      state = ProfileActionError(e.toString());
    }
  }

  void reset() => state = ProfileActionInitial();
}

final profileActionProvider =
    StateNotifierProvider<ProfileActionNotifier, ProfileActionState>((ref) {
  return ProfileActionNotifier(ref.read(profileRepositoryProvider), ref);
});
