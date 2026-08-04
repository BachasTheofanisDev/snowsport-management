function initials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
}

function Avatar({ name, size, style }) {
    const classes = ['dash-avatar']
    if (size === 'sm') classes.push('sm')

    return (
        <div className={classes.join(' ')} style={style}>
            {initials(name) || '?'}
        </div>
    )
}

export default Avatar