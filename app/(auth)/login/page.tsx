import LoginUI from '@/modules/auth/components/login-ui'
import { requireUnAuth } from '@/modules/auth/utils/auth-utils';
import React from 'react'


const Loginpage = async() => {
    await requireUnAuth()
  return (
    <div>
        <LoginUI />
    </div>
  )
}

export default Loginpage