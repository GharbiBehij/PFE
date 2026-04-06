import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';

class RegisterForm extends ConsumerStatefulWidget {
  const RegisterForm({
    required this.onValidationError,
    required this.onErrorDismiss,
    super.key,
  });

  final void Function(String message) onValidationError;
  final VoidCallback onErrorDismiss;

  @override
  ConsumerState<RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends ConsumerState<RegisterForm> {
  final _firstnameCtrl = TextEditingController();
  final _lastnameCtrl  = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _passCtrl     = TextEditingController();
  final _confirmCtrl  = TextEditingController();

  bool _obscurePass    = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _firstnameCtrl.dispose();
    _lastnameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  void _onAnyFieldChanged() => widget.onErrorDismiss();

  void _submit() {
    final firstname = _firstnameCtrl.text.trim();
    final lastname  = _lastnameCtrl.text.trim();
    final email    = _emailCtrl.text.trim();
    final password = _passCtrl.text;
    final confirm  = _confirmCtrl.text;

    if (firstname.isEmpty || lastname.isEmpty || email.isEmpty || password.isEmpty || confirm.isEmpty) {
      widget.onValidationError('Veuillez remplir tous les champs.');
      return;
    }

    final emailRegex = RegExp(r'^[\w\-.]+@([\w\-]+\.)+[\w\-]{2,}$');
    if (!emailRegex.hasMatch(email)) {
      widget.onValidationError('Adresse e-mail invalide.');
      return;
    }

    if (password.length < 8) {
      widget.onValidationError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password != confirm) {
      widget.onValidationError('Les mots de passe ne correspondent pas.');
      return;
    }

    ref.read(authProvider.notifier).signup(
          
          firstname: firstname,
          lastname: lastname,
          email: email,
          password: password,
        );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // First name
        _AuthTextField(
          controller: _firstnameCtrl,
          label: 'Prénom',
          hint: 'Jean',
          prefixIcon: Icons.person_outline_rounded,
          textInputAction: TextInputAction.next,
          enabled: !isLoading,
          onChanged: (_) => _onAnyFieldChanged(),
        ),
        const SizedBox(height: 16),

        // Last name
        _AuthTextField(
          controller: _lastnameCtrl,
          label: 'Nom',
          hint: 'Dupont',
          prefixIcon: Icons.person_outline_rounded,
          textInputAction: TextInputAction.next,
          enabled: !isLoading,
          onChanged: (_) => _onAnyFieldChanged(),
        ),
        const SizedBox(height: 16),

        // Email
        _AuthTextField( 
          controller: _emailCtrl,
          label: 'Adresse e-mail',
          hint: 'votre@email.com',
          prefixIcon: Icons.mail_outline_rounded,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          enabled: !isLoading,
          onChanged: (_) => _onAnyFieldChanged(),
        ),
        const SizedBox(height: 16),

        // Password
        _AuthTextField(
          controller: _passCtrl,
          label: 'Mot de passe',
          hint: '••••••••',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: _obscurePass,
          textInputAction: TextInputAction.next,
          enabled: !isLoading,
          onChanged: (_) => _onAnyFieldChanged(),
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePass
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AppColors.textSecondary,
              size: 20,
            ),
            onPressed: () => setState(() => _obscurePass = !_obscurePass),
          ),
        ),
        const SizedBox(height: 16),

        // Confirm password
        _AuthTextField(
          controller: _confirmCtrl,
          label: 'Confirmer le mot de passe',
          hint: '••••••••',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.done,
          enabled: !isLoading,
          onChanged: (_) => _onAnyFieldChanged(),
          onSubmitted: (_) => _submit(),
          suffixIcon: IconButton(
            icon: Icon(
              _obscureConfirm
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AppColors.textSecondary,
              size: 20,
            ),
            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
          ),
        ),
        const SizedBox(height: 24),

        // Submit button
        SizedBox(
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              foregroundColor: const Color(0xFF111827),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 3,
              shadowColor: AppColors.secondary.withValues(alpha: 0.4),
              disabledBackgroundColor: AppColors.secondary.withValues(alpha: 0.6),
            ),
            onPressed: isLoading ? null : _submit,
            child: isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Color(0xFF111827),
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Créer mon compte',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 18),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

// ── Shared auth text field ─────────────────────────────────────────────────

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.prefixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.onSubmitted,
    this.onChanged,
    this.suffixIcon,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData prefixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  final Widget? suffixIcon;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          onSubmitted: onSubmitted,
          onChanged: onChanged,
          enabled: enabled,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 15,
          ),
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xFFF9FAFB),
            prefixIcon: Icon(prefixIcon, color: AppColors.textSecondary, size: 20),
            suffixIcon: suffixIcon,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
          ),
        ),
      ],
    );
  }
}