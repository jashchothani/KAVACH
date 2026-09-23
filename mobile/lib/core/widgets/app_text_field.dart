import 'package:flutter/material.dart';

import '../theme/app_text_styles.dart';

/// Reusable text form field with label, hint, prefix icon, and validation.
class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.obscureText = false,
    this.maxLines = 1,
    this.onChanged,
    this.autofillHints,
  });

  /// Label displayed above the field.
  final String label;

  /// Placeholder hint inside the field.
  final String? hint;

  /// Text editing controller.
  final TextEditingController? controller;

  /// Icon at the start of the field.
  final IconData? prefixIcon;

  /// Widget at the end of the field (e.g., visibility toggle).
  final Widget? suffixIcon;

  /// Validation function returning an error string or null.
  final String? Function(String?)? validator;

  /// Keyboard type for the field.
  final TextInputType? keyboardType;

  /// Action button on the keyboard.
  final TextInputAction textInputAction;

  /// Whether to obscure text (for passwords).
  final bool obscureText;

  /// Maximum lines for the field.
  final int maxLines;

  /// Callback when text changes.
  final ValueChanged<String>? onChanged;

  /// Autofill hints for platform autofill.
  final Iterable<String>? autofillHints;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: AppTextStyles.inputLabel),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          obscureText: obscureText,
          maxLines: maxLines,
          onChanged: onChanged,
          autofillHints: autofillHints,
          style: AppTextStyles.inputText,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 20) : null,
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }
}
