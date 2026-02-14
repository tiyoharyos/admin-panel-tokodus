export const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export const getUser = () => {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const setUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
  }
}
