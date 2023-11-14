class Utils {
  static Clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }
}

export {Utils};