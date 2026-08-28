type RegistrationTextFields = {
  teamFaceitUrl: string
  representativeEmail: string
  representativePhone: string
  discoverySource: string
}

export const registrationTextLimits = {
  teamFaceitUrl: 300,
  representativeEmail: 180,
  representativePhone: 24,
  discoverySource: 100,
} as const

export function registrationTextLimitError(fields: RegistrationTextFields) {
  if (fields.teamFaceitUrl.length > registrationTextLimits.teamFaceitUrl) {
    return 'O link do time na FACEIT deve ter no máximo 300 caracteres.'
  }
  if (fields.representativeEmail.length > registrationTextLimits.representativeEmail) {
    return 'O e-mail deve ter no máximo 180 caracteres.'
  }
  if (fields.representativePhone.length > registrationTextLimits.representativePhone) {
    return 'O telefone deve ter no máximo 24 caracteres.'
  }
  if (fields.discoverySource.length > registrationTextLimits.discoverySource) {
    return 'A origem da indicação deve ter no máximo 100 caracteres.'
  }
  return null
}
