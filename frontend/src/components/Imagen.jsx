function Imagen({ src, alt, className = "" }) {
  if (src) {
    return <img className={`imagen ${className}`} src={src} alt={alt} />;
  }

  return <div className={`imagen imagen--vacia ${className}`} role="img" aria-label={alt} />;
}

export default Imagen;
