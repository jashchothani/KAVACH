import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

/// Reusable password field with visibility toggle.
class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.validator,
    this.textInputAction = TextInputAction.next,
    this.onChanged,
  });

  /// Label displayed above the field.
  final String label;

  /// Placeholder hint inside the field.
  final String? hint;

  /// Text editing controller.
  final TextEditingController? controller;

  /// Validation function returning an error string or null.
  final String? Function(String?)? validator;

  /// Action button on the keyboard.
  final TextInputAction textInputAction;

  /// Callback when text changes.
  final ValueChanged<String>? onChanged;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscureText = true;

  void _toggleVisibility() {
    setState(() {
      _obscureText = !_obscureText;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(widget.label, style: AppTextStyles.inputLabel),
        const SizedBox(height: 8),
        TextFormField(
          controller: widget.controller,
          validator: widget.validator,
          textInputAction: widget.textInputAction,
          obscureText: _obscureText,
          onChanged: widget.onChanged,
          autofillHints: const [AutofillHints.password],
          style: AppTextStyles.inputText,
          decoration: InputDecoration(
            hintText: widget.hint,
            prefixIcon: const Icon(Icons.lock_outline, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                _obscureText
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                size: 20,
                color: AppColors.textTertiary,
              ),
              onPressed: _toggleVisibility,
              splashRadius: 20,
            ),
          ),
        ),
      ],
    );
  }
}
