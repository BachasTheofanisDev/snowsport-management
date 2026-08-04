function Button({ children, variant = 'primary', size, onClick, type = 'button', disabled, style, ...rest }) {
    const classes = ['btn', `btn-${variant}`]
    if (size === 'sm') classes.push('btn-sm')

    return (
        <button
            type={type}
            className={classes.join(' ')}
            onClick={onClick}
            disabled={disabled}
            style={style}
            {...rest}>
            {children}
        </button>
    )
}

export default Button