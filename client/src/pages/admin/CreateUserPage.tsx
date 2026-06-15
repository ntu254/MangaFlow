import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Shield, CheckCircle2, UserPlus, Info, Edit } from 'lucide-react'
import { useCreateAdminUser } from '@/hooks/useAdmin'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const roles = ['ADMIN', 'MANGAKA', 'ASSISTANT', 'EDITOR', 'BOARD']
const teams = ['Editorial', 'Production', 'Management', 'Art', 'Writing']

export default function CreateUserPage() {
  const navigate = useNavigate()
  const createUser = useCreateAdminUser()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    displayName: '',
    inviteMode: 'manual',
    role: '',
    status: 'Active',
    team: '',
    notes: '',
    password: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    if (submitError) setSubmitError('')
  }

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const isFullNameValid = formData.fullName.trim().length > 0
  const isEmailValid = isValidEmail(formData.email)
  const isRoleValid = formData.role !== ''
  const isTeamValid = formData.team !== ''
  const isDisplayNameValid = formData.displayName.trim().length > 0
  const isPasswordValid = formData.inviteMode === 'email' || formData.password.length >= 8

  const isFormValid = isFullNameValid && isDisplayNameValid && isEmailValid && isRoleValid && isTeamValid && isPasswordValid

  const handleSubmit = () => {
    const clientErrors = getClientFieldErrors(formData, isValidEmail)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      setSubmitError('Please fix the highlighted fields before creating the user.')
      return
    }

    setFieldErrors({})
    setSubmitError('')
    createUser.mutate({
      name: formData.fullName,
      displayName: formData.displayName.trim(),
      team: formData.team,
      notes: formData.notes.trim() || undefined,
      email: formData.email.trim().toLowerCase(),
      password: formData.inviteMode === 'manual' ? formData.password : 'temporary_password',
      role: formData.role || 'MANGAKA',
      isActive: formData.status === 'Active',
    }, {
      onSuccess: () => {
        navigate('/app/admin/users')
      },
      onError: (error) => {
        const parsed = parseCreateUserError(error)
        setSubmitError(parsed.message)
        setFieldErrors(parsed.fieldErrors)
      },
    })
  }

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-10'>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
        <p className="text-sm text-gray-500">Add a new studio member and assign their initial role and status.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column - Form Fields */}
        <div className="xl:col-span-2 space-y-6">

          {/* Basic Information */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User size={18} className="text-purple-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="fullName" placeholder="e.g. Yuki Tanaka" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} aria-invalid={Boolean(fieldErrors.fullName)} />
                  {fieldErrors.fullName && <p className="text-xs text-red-500">{fieldErrors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email Address <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" placeholder="e.g. yuki.tanaka@mangaflow.studio" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} aria-invalid={Boolean(fieldErrors.email)} />
                  {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-gray-700">Display Name <span className="text-red-500">*</span></Label>
                  <Input id="displayName" placeholder="e.g. Yuki Tanaka" value={formData.displayName} onChange={(e) => handleChange('displayName', e.target.value)} aria-invalid={Boolean(fieldErrors.displayName)} />
                  {fieldErrors.displayName && <p className="text-xs text-red-500">{fieldErrors.displayName}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Team <span className="text-red-500">*</span></Label>
                  <Select value={formData.team} onValueChange={(val) => handleChange('team', val)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {fieldErrors.team && <p className="text-xs text-red-500">{fieldErrors.team}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-gray-700">Invite Mode</Label>
                  <Info size={14} className="text-gray-400" />
                </div>
                <RadioGroup value={formData.inviteMode} onValueChange={(val) => handleChange('inviteMode', val)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${formData.inviteMode === 'manual' ? 'border-purple-600 bg-purple-50/50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => handleChange('inviteMode', 'manual')}>
                    <RadioGroupItem value="manual" id="manual-invite" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="manual-invite" className="font-medium cursor-pointer">Set password manually</Label>
                      <p className="text-xs text-gray-500">You will set an initial password for the user.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 border border-gray-200 bg-gray-50 p-4 rounded-lg cursor-not-allowed opacity-60">
                    <RadioGroupItem value="email" id="email-invite" className="mt-1" disabled />
                    <div className="space-y-1">
                      <Label htmlFor="email-invite" className="font-medium">Send invite email</Label>
                      <p className="text-xs text-gray-500">Available after the invitation email service is configured.</p>
                    </div>
                  </div>

                </RadioGroup>
                {formData.inviteMode === 'manual' && (
                  <div className="mt-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50 space-y-2">
                    <Label htmlFor="password">Initial Password <span className="text-red-500">*</span></Label>
                    <Input id="password" type="text" placeholder="Enter a secure initial password..." value={formData.password} onChange={(e) => handleChange('password', e.target.value)} aria-invalid={Boolean(fieldErrors.password)} />
                    <p className="text-xs text-gray-500">The user must use this password to log in for the first time.</p>
                    {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role & Status */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield size={18} className="text-purple-600" />
                Role & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Role <span className="text-red-500">*</span></Label>
                  <Select value={formData.role} onValueChange={(val) => handleChange('role', val)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {fieldErrors.role && <p className="text-xs text-red-500">{fieldErrors.role}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Account Status <span className="text-red-500">*</span></Label>
                  <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                    <SelectTrigger className="bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-500">Roles define what the user can access and which actions they can perform.</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Internal Notes</CardTitle>
              <CardDescription className="text-xs">Optional context visible to administrators.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                placeholder="Add onboarding or account notes..."
                maxLength={1000}
                aria-invalid={Boolean(fieldErrors.notes)}
              />
              {fieldErrors.notes && <p className="mt-2 text-xs text-red-500">{fieldErrors.notes}</p>}
            </CardContent>
          </Card>


        </div>

        {/* Right Column - Previews & Actions */}
        <div className="space-y-6">

          {/* Invite Preview */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                <Mail size={16} className="text-purple-600" />
                Account Preview
              </CardTitle>
              <CardDescription className="text-xs">Review the account that will be created.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-100 rounded-lg p-4 space-y-4 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formData.fullName || 'User Name'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{formData.email || 'user@example.com'}</p>
                      {formData.role && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] h-4 px-1.5 font-medium hover:bg-purple-100">
                          {formData.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>This user will be added to MangaFlow Studio.</p>
                  <p>Share the initial credentials with them through a secure channel.</p>
                </div>
                <Button variant="secondary" className="w-auto h-8 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 pointer-events-none">
                  Account Access
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation Checklist */}
          <Card className={`shadow-sm border-gray-100 ${isFormValid ? 'bg-emerald-50/30' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                <CheckCircle2 size={16} className={isFormValid ? "text-emerald-600" : "text-purple-600"} />
                Validation Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs">
                <li className={`flex items-center gap-2 ${isFullNameValid ? 'text-emerald-600' : 'text-gray-500'}`}>
                  <CheckCircle2 size={14} className={isFullNameValid ? "text-emerald-500" : "text-gray-300"} />
                  Full name is required
                </li>
                <li className={`flex items-center gap-2 ${isEmailValid ? 'text-emerald-600' : 'text-gray-500'}`}>
                  <CheckCircle2 size={14} className={isEmailValid ? "text-emerald-500" : "text-gray-300"} />
                  Email address is valid
                </li>
                <li className={`flex items-center gap-2 ${isDisplayNameValid ? 'text-emerald-600' : 'text-gray-500'}`}>
                  <CheckCircle2 size={14} className={isDisplayNameValid ? "text-emerald-500" : "text-gray-300"} />
                  Display name is required
                </li>
                <li className={`flex items-center gap-2 ${isRoleValid ? 'text-emerald-600' : 'text-gray-500'}`}>
                  <CheckCircle2 size={14} className={isRoleValid ? "text-emerald-500" : "text-gray-300"} />
                  Role is selected
                </li>
                <li className={`flex items-center gap-2 ${isTeamValid ? 'text-emerald-600' : 'text-gray-500'}`}>
                  <CheckCircle2 size={14} className={isTeamValid ? "text-emerald-500" : "text-gray-300"} />
                  Team / team is selected
                </li>
                {formData.inviteMode === 'manual' && (
                  <li className={`flex items-center gap-2 ${isPasswordValid ? 'text-emerald-600' : 'text-gray-500'}`}>
                    <CheckCircle2 size={14} className={isPasswordValid ? "text-emerald-500" : "text-gray-300"} />
                    Password is at least 8 characters
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                <Edit size={16} className="text-purple-600" />
                Actions
              </CardTitle>
              <CardDescription className="text-xs">Review details before creating the user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {submitError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {submitError}
                </div>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || createUser.isPending}
                className="w-full justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <UserPlus size={16} /> {createUser.isPending ? 'Creating...' : 'Create User'}
              </Button>
              <p className="text-[10px] text-center text-gray-400 mt-2">The account will appear in the Users list after creation.</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

type CreateUserFormData = {
  fullName: string
  email: string
  displayName: string
  inviteMode: string
  role: string
  status: string
  team: string
  notes: string
  password: string
}

type ParsedCreateUserError = {
  message: string
  fieldErrors: Record<string, string>
}

type ApiErrorResponse = {
  message?: string
  errors?: Array<{ path?: string[] | string; message?: string }>
}

function getClientFieldErrors(
  formData: CreateUserFormData,
  isValidEmail: (email: string) => boolean,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!formData.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!formData.displayName.trim()) errors.displayName = 'Display name is required.'
  if (!formData.email.trim()) errors.email = 'Email address is required.'
  else if (!isValidEmail(formData.email)) errors.email = 'Enter a valid email address.'
  if (!formData.role) errors.role = 'Select a role.'
  if (!formData.team) errors.team = 'Select a team.'
  if (formData.inviteMode === 'manual' && formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (formData.notes.length > 1000) errors.notes = 'Notes must be 1000 characters or fewer.'
  return errors
}

function parseCreateUserError(error: unknown): ParsedCreateUserError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      message: 'Unable to create user. Please try again.',
      fieldErrors: {},
    }
  }

  const status = error.response?.status
  const response = error.response?.data
  const backendMessage = response?.message?.trim()
  const fieldErrors = mapBackendErrors(response)

  if (status === 409 || backendMessage?.toLowerCase().includes('email already registered')) {
    return {
      message: 'A user with this email already exists.',
      fieldErrors: { ...fieldErrors, email: 'This email is already registered.' },
    }
  }

  if (status === 400) {
    return {
      message: backendMessage || 'Some fields are invalid. Please review the highlighted fields.',
      fieldErrors,
    }
  }

  if (status === 401) {
    return {
      message: 'Your session expired. Please sign in again before creating a user.',
      fieldErrors,
    }
  }

  if (status === 403) {
    return {
      message: 'You do not have permission to create users.',
      fieldErrors,
    }
  }

  if (!error.response) {
    return {
      message: 'Cannot reach the server. Check the backend connection and try again.',
      fieldErrors,
    }
  }

  return {
    message: backendMessage || 'Server error while creating user. Please try again.',
    fieldErrors,
  }
}

function mapBackendErrors(response?: ApiErrorResponse): Record<string, string> {
  const errors: Record<string, string> = {}

  response?.errors?.forEach((item) => {
    const rawPath = Array.isArray(item.path) ? item.path[0] : item.path
    const field = mapBackendFieldToFormField(rawPath)
    if (field && item.message) errors[field] = item.message
  })

  const message = response?.message ?? ''
  const lower = message.toLowerCase()
  if (lower.includes('email')) errors.email = message
  if (lower.includes('password')) errors.password = message
  if (lower.includes('name is required') || lower.includes('name')) errors.fullName = message
  if (lower.includes('display')) errors.displayName = message
  if (lower.includes('team')) errors.team = message
  if (lower.includes('role')) errors.role = message
  if (lower.includes('notes')) errors.notes = message

  return errors
}

function mapBackendFieldToFormField(field?: string) {
  const map: Record<string, string> = {
    name: 'fullName',
    email: 'email',
    password: 'password',
    displayName: 'displayName',
    team: 'team',
    role: 'role',
    notes: 'notes',
  }
  return field ? map[field] : undefined
}
