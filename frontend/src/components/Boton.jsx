function Boton({ children, variante = "principal", href, type = "button", ...props }) {
  const clase = `boton boton--${variante}`;

  if (href) {
    return (
      <a className={clase} href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={clase} type={type} {...props}>
      {children}
    </button>
  );
}

export default Boton;
