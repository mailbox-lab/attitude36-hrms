'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Mail,
  Lock,
  User,
  Building,
  KeyRound,
} from 'lucide-react'
import Image from 'next/image'



const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design', 'Other']

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  shake: { x: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } },
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 text-white bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
      <div>
        <div className="flex items-center gap-4 mb-8">
          <Image src="/logo.png" alt="Attitude360" width={64} height={64} className="rounded-2xl bg-white/20 backdrop-blur" />
          <div>
            <h1 className="text-3xl font-bold">Attitude360</h1>
            <p className="text-white/70">Human Resource Management System</p>
          </div>
        </div>

        <div className="space-y-4 mt-12">
          {['Candidate Management', 'Client & Job Tracking', 'Interview Scheduling', 'Placements & Analytics'].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-white/90 text-lg">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-white/50 text-sm">© 2026 Attitude360</p>
    </div>
  )
}

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showInviteCode, setShowInviteCode] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteCodeValid, setInviteCodeValid] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'EMPLOYEE' | 'HR'>('EMPLOYEE')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup fields
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupDepartment, setSignupDepartment] = useState('Engineering')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      triggerShake()
      setLoading(false)
    }
    // If no error, the parent component will detect session change and switch to main app
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service')
      triggerShake()
      return
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match')
      triggerShake()
      return
    }

    setLoading(true)

    try {
      const body: Record<string, string> = {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        department: signupDepartment,
      }

      if (showInviteCode && inviteCodeValid) {
        body.role = selectedRole
        body.inviteCode = inviteCode
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        triggerShake()
        setLoading(false)
        return
      }

      // Auto-login after signup
      await signIn('credentials', {
        email: signupEmail,
        password: signupPassword,
        redirect: false,
      })
    } catch {
      setError('Something went wrong. Please try again.')
      triggerShake()
      setLoading(false)
    }
  }

  const handleInviteCodeCheck = () => {
    const validCode = process.env.NEXT_PUBLIC_INVITE_CODE || 'a360founder'
    setInviteCodeValid(inviteCode === validCode)
    if (inviteCode !== validCode) {
      setError('Invalid invite code')
      triggerShake()
    } else {
      setError('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <LeftPanel />

      {/* Mobile branding - shown on small screens */}
      <div className="lg:hidden flex flex-col items-center pt-12 pb-4">
        <Image src="/logo.png" alt="Attitude360" width={56} height={56} className="rounded-2xl mb-3" />
        <h1 className="text-xl font-bold">Attitude360</h1>
        <p className="text-sm text-muted-foreground">Human Resource Management System</p>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          key={mode}
          variants={formVariants}
          initial="hidden"
          animate={shake ? 'shake' : 'visible'}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl rounded-2xl border-0">
            <CardHeader className="pb-4 pt-8 px-8">
              {mode === 'login' ? (
                <>
                  <h2 className="text-2xl font-bold">Welcome Back</h2>
                  <p className="text-sm text-muted-foreground">Sign in to your account</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">Create Account</h2>
                  <p className="text-sm text-muted-foreground">Join Attitude360</p>
                </>
              )}
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  <motion.form
                    key="login-form"
                    onSubmit={handleLogin}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          required
                          placeholder="you@company.com"
                          className="pl-10"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                        Remember me
                      </Label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 h-11"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>

                    {/* Toggle to signup */}
                    <p className="text-center text-sm text-muted-foreground">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => { setMode('signup'); setError('') }}
                      >
                        Sign Up
                      </button>
                    </p>


                  </motion.form>
                ) : (
                  <motion.form
                    key="signup-form"
                    onSubmit={handleSignup}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          required
                          minLength={2}
                          placeholder="John Doe"
                          className="pl-10"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          placeholder="you@company.com"
                          className="pl-10"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-department">Department</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          id="signup-department"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={signupDepartment}
                          onChange={(e) => setSignupDepartment(e.target.value)}
                        >
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Min. 6 characters"
                          className="pl-10 pr-10"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Re-enter password"
                          className="pl-10 pr-10"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Invite code toggle */}
                    {!showInviteCode ? (
                      <button
                        type="button"
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => setShowInviteCode(true)}
                      >
                        Have an invite code?
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                        <div className="space-y-2">
                          <Label htmlFor="invite-code" className="text-xs">Invite Code</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="invite-code"
                                placeholder="Enter invite code"
                                className="pl-10"
                                value={inviteCode}
                                onChange={(e) => { setInviteCode(e.target.value); setInviteCodeValid(false) }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleInviteCodeCheck}
                            >
                              Verify
                            </Button>
                          </div>
                        </div>
                        {inviteCodeValid && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                          >
                            <Label className="text-xs text-emerald-600">✓ Code verified! Select your role:</Label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                  selectedRole === 'EMPLOYEE'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                    : 'border-border hover:border-muted-foreground/30'
                                }`}
                                onClick={() => setSelectedRole('EMPLOYEE')}
                              >
                                Employee
                              </button>
                              <button
                                type="button"
                                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                  selectedRole === 'HR'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                    : 'border-border hover:border-muted-foreground/30'
                                }`}
                                onClick={() => setSelectedRole('HR')}
                              >
                                HR Manager
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Terms */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                      />
                      <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                        I agree to the{' '}
                        <span className="text-emerald-600 hover:text-emerald-700 font-medium">Terms of Service</span>
                      </Label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 h-11"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>

                    {/* Toggle to login */}
                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => { setMode('login'); setError('') }}
                      >
                        Sign In
                      </button>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
