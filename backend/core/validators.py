from rest_framework.exceptions import ValidationError

def validate_cross_organization_reference(user, **kwargs):
    """
    Validates that all provided objects belong to the user's organization.
    Usage: validate_cross_organization_reference(user, company=company_instance, contract=contract_instance)
    """
    if not user.organization:
        raise ValidationError("User does not belong to an organization.")

    for field_name, instance in kwargs.items():
        if instance and instance.organization != user.organization:
            raise ValidationError({field_name: f"Invalid {field_name}. It does not belong to your organization."})
