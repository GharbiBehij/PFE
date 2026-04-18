import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/profile/models/update_profile_request.dart';
import 'package:esim_frontend/features/profile/models/user_profile.dart';
import 'package:esim_frontend/features/profile/presentation/providers/profile_providers.dart';

const _kBg = Color(0xFFF9FAFB);
const _kWhite = Colors.white;
const _kViolet = Color(0xFF7C3AED);
const _kVioletDark = Color(0xFF5B21B6);
const _kIndigo = Color(0xFF4338CA);
const _kViolet50 = Color(0xFFF5F3FF);
const _kViolet100 = Color(0xFFEDE9FE);
const _kGray900 = Color(0xFF111827);
const _kGray800 = Color(0xFF1F2937);
const _kGray700 = Color(0xFF374151);
const _kGray500 = Color(0xFF6B7280);
const _kGray400 = Color(0xFF9CA3AF);
const _kGray300 = Color(0xFFD1D5DB);
const _kGray100 = Color(0xFFF3F4F6);
const _kYellow = Color(0xFFFACC15);
const _kRed = Color(0xFFEF4444);
const _kRed50 = Color(0xFFFEE2E2);

const _kPad = 24.0;
const _kRadiusCard = 24.0;

enum _ProfileView { main, personal, payment, settings, help }

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  _ProfileView _activeView = _ProfileView.main;
  bool _seeded = false;
  bool _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_handleNameChange);
  }

  @override
  void dispose() {
    _nameController.removeListener(_handleNameChange);
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _handleNameChange() {
    if (mounted) {
      setState(() {});
    }
  }

  void _seedFromProfile(UserProfile profile) {
    if (_seeded) return;
    _nameController.text = profile.name;
    _emailController.text = profile.email;
    _phoneController.text = profile.phone ?? '';
    _seeded = true;
  }

  String get _displayName {
    final value = _nameController.text.trim();
    return value.isEmpty ? 'John Doe' : value;
  }

  String get _displayEmail {
    final value = _emailController.text.trim();
    return value.isEmpty ? 'john.doe@example.com' : value;
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

  Future<void> _saveProfile() async {
    final fullName = _nameController.text.trim();
    final nameParts = fullName.isEmpty
        ? <String>[]
        : fullName.split(RegExp(r'\s+'));

    final firstName = nameParts.isEmpty ? null : nameParts.first;
    final lastName = nameParts.length > 1
        ? nameParts.sublist(1).join(' ')
        : null;

    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();

    await ref
        .read(profileActionProvider.notifier)
        .updateProfile(
          UpdateProfileRequest(
            firstname: firstName,
            lastname: lastName,
            email: email.isEmpty ? null : email,
            phone: phone.isEmpty ? null : phone,
          ),
        );
  }

  Future<void> _logout(BuildContext context) async {
    await ref.read(authProvider.notifier).logout();
    if (!mounted) return;
    context.go(RouteNames.login);
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
      backgroundColor: _kBg,
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(_kPad),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  error.toString(),
                  style: const TextStyle(color: _kGray700),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                MotionPressable(
                  onTap: () => ref.invalidate(userProfileProvider),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: _kViolet,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Retry',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        data: (profile) {
          _seedFromProfile(profile);

          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            switchInCurve: Curves.easeOut,
            switchOutCurve: Curves.easeIn,
            transitionBuilder: (child, animation) {
              final slide = Tween<Offset>(
                begin: const Offset(0.05, 0),
                end: Offset.zero,
              ).animate(animation);

              return FadeTransition(
                opacity: animation,
                child: SlideTransition(position: slide, child: child),
              );
            },
            child: KeyedSubtree(
              key: ValueKey(_activeView),
              child: switch (_activeView) {
                _ProfileView.main => _MainProfileView(
                  safeTop: safeTop,
                  initials: _initials,
                  name: _displayName,
                  email: _displayEmail,
                  onPersonalTap: () =>
                      setState(() => _activeView = _ProfileView.personal),
                  onPaymentTap: () =>
                      setState(() => _activeView = _ProfileView.payment),
                  onSettingsTap: () =>
                      setState(() => _activeView = _ProfileView.settings),
                  onHelpTap: () =>
                      setState(() => _activeView = _ProfileView.help),
                  onLogoutTap: () => _logout(context),
                ),
                _ProfileView.personal => PersonalDetailsPage(
                  safeTop: safeTop,
                  initials: _initials,
                  nameController: _nameController,
                  emailController: _emailController,
                  phoneController: _phoneController,
                  isSaving: isSaving,
                  onBack: () => setState(() => _activeView = _ProfileView.main),
                  onSave: _saveProfile,
                ),
                _ProfileView.payment => PaymentPage(
                  safeTop: safeTop,
                  cardholderName: _displayName,
                  onBack: () => setState(() => _activeView = _ProfileView.main),
                ),
                _ProfileView.settings => SettingsPage(
                  safeTop: safeTop,
                  notificationsEnabled: _notificationsEnabled,
                  onBack: () => setState(() => _activeView = _ProfileView.main),
                  onNotificationsToggle: () => setState(
                    () => _notificationsEnabled = !_notificationsEnabled,
                  ),
                ),
                _ProfileView.help => HelpPage(
                  safeTop: safeTop,
                  onBack: () => setState(() => _activeView = _ProfileView.main),
                ),
              },
            ),
          );
        },
      ),
    );
  }
}

class _MainProfileView extends StatelessWidget {
  const _MainProfileView({
    required this.safeTop,
    required this.initials,
    required this.name,
    required this.email,
    required this.onPersonalTap,
    required this.onPaymentTap,
    required this.onSettingsTap,
    required this.onHelpTap,
    required this.onLogoutTap,
  });

  final double safeTop;
  final String initials;
  final String name;
  final String email;
  final VoidCallback onPersonalTap;
  final VoidCallback onPaymentTap;
  final VoidCallback onSettingsTap;
  final VoidCallback onHelpTap;
  final VoidCallback onLogoutTap;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(_kPad, safeTop + 12, _kPad, 32),
            decoration: BoxDecoration(
              color: _kWhite,
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(32),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                ProfileHeader(initials: initials, name: name, email: email),
                const SizedBox(height: 24),
                StatsCard(points: '2,450', onRedeemTap: () {}),
              ],
            ),
          ),
          const SizedBox(height: 24),
          MenuSection(
            title: 'Account',
            items: [
              MenuItemTile(
                icon: Icons.person_outline,
                label: 'Personal Details',
                onTap: onPersonalTap,
              ),
              MenuItemTile(
                icon: Icons.credit_card_outlined,
                label: 'Payment Methods',
                onTap: onPaymentTap,
              ),
              MenuItemTile(
                icon: Icons.settings_outlined,
                label: 'Settings',
                onTap: onSettingsTap,
              ),
            ],
          ),
          const SizedBox(height: 20),
          MenuSection(
            title: 'Support',
            items: [
              MenuItemTile(
                icon: Icons.help_outline,
                label: 'Help Center',
                onTap: onHelpTap,
              ),
              MenuItemTile(
                icon: Icons.logout_rounded,
                label: 'Log Out',
                onTap: onLogoutTap,
                destructive: true,
                showChevron: false,
              ),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({
    super.key,
    required this.initials,
    required this.name,
    required this.email,
  });

  final String initials;
  final String name;
  final String email;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: const BoxDecoration(
            color: _kViolet100,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            initials,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: _kViolet,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: _kGray800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                email,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: _kGray500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class StatsCard extends StatelessWidget {
  const StatsCard({super.key, required this.points, required this.onRedeemTap});

  final String points;
  final VoidCallback onRedeemTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kViolet50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'NETYFLY POINTS',
                  style: TextStyle(
                    color: _kViolet,
                    fontSize: 11,
                    letterSpacing: 1.1,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  points,
                  style: const TextStyle(
                    color: _kVioletDark,
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
          MotionPressable(
            onTap: onRedeemTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: _kYellow,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Text(
                'Redeem',
                style: TextStyle(
                  color: _kVioletDark,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MenuSection extends StatelessWidget {
  const MenuSection({super.key, required this.title, required this.items});

  final String title;
  final List<Widget> items;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: _kPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Text(
              title.toUpperCase(),
              style: const TextStyle(
                fontSize: 12,
                letterSpacing: 1.1,
                fontWeight: FontWeight.w700,
                color: _kGray400,
              ),
            ),
          ),
          const SizedBox(height: 10),
          ...items.expand((item) => [item, const SizedBox(height: 8)]).toList()
            ..removeLast(),
        ],
      ),
    );
  }
}

class MenuItemTile extends StatefulWidget {
  const MenuItemTile({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.destructive = false,
    this.showChevron = true,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool destructive;
  final bool showChevron;

  @override
  State<MenuItemTile> createState() => _MenuItemTileState();
}

class _MenuItemTileState extends State<MenuItemTile> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final iconBg = widget.destructive ? _kRed50 : _kGray100;
    final iconColor = widget.destructive ? _kRed : _kGray500;
    final labelColor = widget.destructive ? _kRed : _kGray700;

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: MotionPressable(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: widget.destructive && _hovered
                ? const Color(0xFFFEF2F2)
                : _kWhite,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: _hovered ? 0.06 : 0.04),
                blurRadius: _hovered ? 12 : 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(widget.icon, size: 20, color: iconColor),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  widget.label,
                  style: TextStyle(
                    color: labelColor,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (widget.showChevron)
                const Icon(Icons.chevron_right, size: 20, color: _kGray400),
            ],
          ),
        ),
      ),
    );
  }
}

class _SubPageScaffold extends StatelessWidget {
  const _SubPageScaffold({
    required this.safeTop,
    required this.title,
    required this.onBack,
    required this.child,
  });

  final double safeTop;
  final String title;
  final VoidCallback onBack;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: _kBg,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(_kPad, safeTop + 12, _kPad, 24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [_kViolet, _kIndigo],
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                MotionPressable(
                  onTap: onBack,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: const Icon(
                          Icons.arrow_back,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(_kPad, _kPad, _kPad, 96),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

class PersonalDetailsPage extends StatelessWidget {
  const PersonalDetailsPage({
    super.key,
    required this.safeTop,
    required this.initials,
    required this.nameController,
    required this.emailController,
    required this.phoneController,
    required this.onBack,
    required this.onSave,
    required this.isSaving,
  });

  final double safeTop;
  final String initials;
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController phoneController;
  final VoidCallback onBack;
  final Future<void> Function() onSave;
  final bool isSaving;

  @override
  Widget build(BuildContext context) {
    return _SubPageScaffold(
      safeTop: safeTop,
      title: 'Personal Details',
      onBack: onBack,
      child: Container(
        decoration: BoxDecoration(
          color: _kWhite,
          borderRadius: BorderRadius.circular(_kRadiusCard),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    color: _kViolet100,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initials,
                    style: const TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w700,
                      color: _kViolet,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                MotionPressable(
                  onTap: () {},
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: _kViolet50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Change Photo',
                      style: TextStyle(
                        color: _kViolet,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _ProfileInputField(
              label: 'Full Name',
              keyboardType: TextInputType.name,
              controller: nameController,
            ),
            const SizedBox(height: 14),
            _ProfileInputField(
              label: 'Email Address',
              keyboardType: TextInputType.emailAddress,
              controller: emailController,
            ),
            const SizedBox(height: 14),
            _ProfileInputField(
              label: 'Phone Number',
              keyboardType: TextInputType.phone,
              controller: phoneController,
            ),
            const SizedBox(height: 24),
            MotionPressable(
              onTap: isSaving ? () {} : () => onSave(),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: _kYellow,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: _kGray900,
                        ),
                      )
                    : const Text(
                        'Save Changes',
                        style: TextStyle(
                          color: _kGray900,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileInputField extends StatelessWidget {
  const _ProfileInputField({
    required this.label,
    required this.controller,
    required this.keyboardType,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType keyboardType;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            label,
            style: const TextStyle(
              color: _kGray700,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(
            color: _kGray800,
            fontSize: 15,
            fontWeight: FontWeight.w500,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: _kBg,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFF3F4F6), width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFF3F4F6), width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: _kViolet, width: 1.2),
            ),
          ),
        ),
      ],
    );
  }
}

class PaymentPage extends StatelessWidget {
  const PaymentPage({
    super.key,
    required this.safeTop,
    required this.cardholderName,
    required this.onBack,
  });

  final double safeTop;
  final String cardholderName;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return _SubPageScaffold(
      safeTop: safeTop,
      title: 'Payment Methods',
      onBack: onBack,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [Color(0xFF1F2937), Color(0xFF111827)],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  right: -16,
                  top: -16,
                  child: Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'CURRENT CARD',
                                style: TextStyle(
                                  color: _kGray400,
                                  fontSize: 10,
                                  letterSpacing: 1.1,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                '•••• •••• •••• 4242',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'VISA',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 34),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'CARDHOLDER',
                                style: TextStyle(
                                  color: _kGray400,
                                  fontSize: 10,
                                  letterSpacing: 0.7,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                cardholderName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'EXPIRES',
                              style: TextStyle(
                                color: _kGray400,
                                fontSize: 10,
                                letterSpacing: 0.7,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              '12/28',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          MotionPressable(
            onTap: () {},
            child: CustomPaint(
              painter: _DashedRRectPainter(
                color: const Color(0xFFD1D5DB),
                radius: 16,
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: _kWhite,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.credit_card_outlined, color: _kViolet, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Add New Payment Method',
                      style: TextStyle(
                        color: _kViolet,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({
    super.key,
    required this.safeTop,
    required this.notificationsEnabled,
    required this.onBack,
    required this.onNotificationsToggle,
  });

  final double safeTop;
  final bool notificationsEnabled;
  final VoidCallback onBack;
  final VoidCallback onNotificationsToggle;

  @override
  Widget build(BuildContext context) {
    return _SubPageScaffold(
      safeTop: safeTop,
      title: 'Settings',
      onBack: onBack,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _kWhite,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            _SettingsRowToggle(
              icon: Icons.notifications_none,
              title: 'Push Notifications',
              subtitle: 'Stay updated on your usage',
              enabled: notificationsEnabled,
              onToggle: onNotificationsToggle,
            ),
            const Divider(height: 24, color: Color(0xFFF3F4F6)),
            const _SettingsRowChevron(
              icon: Icons.public,
              title: 'Language',
              subtitle: 'English (US)',
            ),
            const Divider(height: 24, color: Color(0xFFF3F4F6)),
            const _SettingsRowChevron(
              icon: Icons.shield_outlined,
              title: 'Privacy & Security',
              subtitle: 'Manage your data',
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsRowToggle extends StatelessWidget {
  const _SettingsRowToggle({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.enabled,
    required this.onToggle,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool enabled;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _SettingsIcon(icon: icon),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: _kGray800,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: _kGray500,
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
        MotionPressable(
          onTap: onToggle,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: 48,
            height: 28,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: enabled ? _kViolet : _kGray300,
              borderRadius: BorderRadius.circular(999),
            ),
            child: AnimatedAlign(
              duration: const Duration(milliseconds: 180),
              alignment: enabled ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 18,
                height: 18,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _SettingsRowChevron extends StatelessWidget {
  const _SettingsRowChevron({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _SettingsIcon(icon: icon),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: _kGray800,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: _kGray500,
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
        const Icon(Icons.chevron_right, size: 20, color: _kGray400),
      ],
    );
  }
}

class _SettingsIcon extends StatelessWidget {
  const _SettingsIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: _kViolet100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, size: 20, color: _kViolet),
    );
  }
}

class HelpPage extends StatelessWidget {
  const HelpPage({super.key, required this.safeTop, required this.onBack});

  final double safeTop;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    const faqItems = [
      'How do I activate my eSIM?',
      'Can I use WhatsApp with eSIM?',
      'How to check my remaining data?',
    ];

    return _SubPageScaffold(
      safeTop: safeTop,
      title: 'Help Center',
      onBack: onBack,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _kViolet50,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _kViolet100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'How can we help you?',
                  style: TextStyle(
                    color: Color(0xFF4C1D95),
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Our support team is available 24/7 to assist you with any eSIM related questions.',
                  style: TextStyle(
                    color: Color(0xFF6D28D9),
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 14),
                MotionPressable(
                  onTap: () {},
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: _kViolet,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Text(
                      'Start Live Chat',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          const Padding(
            padding: EdgeInsets.only(left: 4),
            child: Text(
              'Frequently Asked Questions',
              style: TextStyle(
                color: _kGray800,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _kWhite,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                for (var i = 0; i < faqItems.length; i++) ...[
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          faqItems[i],
                          style: const TextStyle(
                            color: _kGray800,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        size: 16,
                        color: _kGray400,
                      ),
                    ],
                  ),
                  if (i != faqItems.length - 1)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      child: Divider(height: 1, color: Color(0xFFF3F4F6)),
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedRRectPainter extends CustomPainter {
  static const double _strokeWidth = 2;
  static const double _dash = 6;
  static const double _gap = 5;

  _DashedRRectPainter({
    required this.color,
    required this.radius,
  });

  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(
      rect.deflate(_strokeWidth / 2),
      Radius.circular(radius),
    );
    final path = Path()..addRRect(rrect);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = _strokeWidth;

    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = distance + _dash;
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + _gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.radius != radius;
  }
}
