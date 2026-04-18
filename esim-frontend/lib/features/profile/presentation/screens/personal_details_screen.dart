import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/features/profile/models/update_profile_request.dart';
import 'package:esim_frontend/features/profile/presentation/providers/profile_providers.dart';
import 'package:esim_frontend/features/profile/presentation/screens/profile_screen.dart';

class PersonalDetailsScreen extends ConsumerStatefulWidget {
  const PersonalDetailsScreen({super.key});

  @override
  ConsumerState<PersonalDetailsScreen> createState() =>
      _PersonalDetailsScreenState();
}

class _PersonalDetailsScreenState extends ConsumerState<PersonalDetailsScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _seeded = false;

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_refreshForInitials);
  }

  @override
  void dispose() {
    _nameController.removeListener(_refreshForInitials);
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _refreshForInitials() {
    if (mounted) {
      setState(() {});
    }
  }

  String get _displayName {
    final value = _nameController.text.trim();
    return value.isEmpty ? 'John Doe' : value;
  }

  String get _initials {
    final parts = _displayName.split(RegExp(r'\s+'));
    if (parts.isEmpty) return 'JD';
    return parts
        .where((p) => p.isNotEmpty)
        .take(2)
        .map((p) => p[0].toUpperCase())
        .join();
  }

  void _seed(ProfileActionState actionState) {
    if (_seeded) return;
    final profile = ref.read(userProfileProvider).value;
    if (profile == null) return;
    _nameController.text = profile.name;
    _emailController.text = profile.email;
    _phoneController.text = profile.phone ?? '';
    _seeded = true;
  }

  Future<void> _save() async {
    final fullName = _nameController.text.trim();
    final parts = fullName.isEmpty
        ? <String>[]
        : fullName.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();

    final firstname = parts.isEmpty ? null : parts.first;
    final lastname = parts.length > 1 ? parts.sublist(1).join(' ') : null;
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();

    await ref
        .read(profileActionProvider.notifier)
        .updateProfile(
          UpdateProfileRequest(
            firstname: firstname,
            lastname: lastname,
            email: email.isEmpty ? null : email,
            phone: phone.isEmpty ? null : phone,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final safeTop = MediaQuery.of(context).padding.top;
    final profileAsync = ref.watch(userProfileProvider);
    final actionState = ref.watch(profileActionProvider);
    final isSaving = actionState is ProfileActionLoading;

    ref.listen<ProfileActionState>(profileActionProvider, (previous, next) {
      if (!mounted) return;
      if (next is ProfileActionSuccess) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(next.message)));
      }
      if (next is ProfileActionError) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(next.message)));
      }
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (profile) {
          _seed(actionState);
          return PersonalDetailsPage(
            safeTop: safeTop,
            initials: _initials.isEmpty ? profile.initials : _initials,
            nameController: _nameController,
            emailController: _emailController,
            phoneController: _phoneController,
            onBack: () => context.pop(),
            onSave: _save,
            isSaving: isSaving,
          );
        },
      ),
    );
  }
}
