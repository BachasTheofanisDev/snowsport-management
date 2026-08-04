function Badge({ children, status = 'confirmed', style }) {
    return (
        <span className={`badge badge-${status}`} style={style}>
            {children}
        </span>
    )
}

export default Badge