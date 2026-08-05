cd "$(dirname "$0")"

python3 -c "
path = 'server/src/routes/auth.js'
with open(path) as f:
    content = f.read()

old_fn = '''function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Frontend and backend live on different Render subdomains in production,
    // which makes this a cross-site cookie — SameSite=None + Secure is required
    // for the browser to send it at all. Locally (same-site) 'lax' is enough.
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/api/auth',
    maxAge: REFRESH_TTL_MS,
  };
}'''

new_fn = '''function refreshCookieOptions(rememberMe = true) {
  const isProd = process.env.NODE_ENV === 'production';
  const opts = {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/api/auth',
  };
  if (rememberMe) opts.maxAge = REFRESH_TTL_MS;
  return opts;
}'''

content = content.replace(old_fn, new_fn)
content = content.replace(
    '''const { regNo, password } = req.body;''',
    '''const { regNo, password, rememberMe } = req.body;'''
)
content = content.replace(
    '''res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    res.json({ accessToken, user: publicUser(found) });''',
    '''res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(rememberMe !== false));
    res.json({ accessToken, user: publicUser(found) });'''
)

with open(path, 'w') as f:
    f.write(content)
print('1/3 auth.js — remember-me cookie logic added')
"

python3 -c "
path = 'src/context/AuthContext.jsx'
with open(path) as f:
    content = f.read()
content = content.replace(
    '''const login = async (regNo, password) => {
    setError(null);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ regNo, password }),
      }, false);''',
    '''const login = async (regNo, password, rememberMe = true) => {
    setError(null);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ regNo, password, rememberMe }),
      }, false);'''
)
with open(path, 'w') as f:
    f.write(content)
print('2/3 AuthContext.jsx updated')
"

python3 -c "
path = 'src/pages/Login.jsx'
with open(path) as f:
    content = f.read()
content = content.replace(
    '''const [password, setPassword] = useState('');''',
    '''const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);'''
)
content = content.replace(
    '''const ok = await login(regNo, password);''',
    '''const ok = await login(regNo, password, rememberMe);'''
)
content = content.replace(
    '''<label className=\"remember\"><input type=\"checkbox\" />Remember me</label>''',
    '''<label className=\"remember\">
              <input type=\"checkbox\" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
              Remember me
            </label>'''
)
with open(path, 'w') as f:
    f.write(content)
print('3/3 Login.jsx — checkbox wired up')
"

echo ""
echo "Done. Verify with: grep rememberMe server/src/routes/auth.js src/context/AuthContext.jsx src/pages/Login.jsx"