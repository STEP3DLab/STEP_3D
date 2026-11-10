"""Regression checks for the inline-navigation generator, without broad rebuilding."""
from pathlib import Path
import runpy, tempfile, unittest

root=Path(__file__).resolve().parents[2]
helper=runpy.run_path(str(root/'trifoti-source/warm/inline-navigation.py'))
controller=(root/'trifoti/warm/header-navigation.js').read_text()
base='<html><head>{script}</head><body><header class="header">unchanged header</header><main id="main">unchanged content</main></body></html>'

class InlineBuild(unittest.TestCase):
    def build(self, html):
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)
            (target/'header-navigation.js').write_text(controller)
            page=target/'index.html';page.write_text(html)
            helper['apply'](target)
            first=page.read_text()
            helper['apply'](target)
            self.assertEqual(first,page.read_text())
            self.assertEqual((target/'header-navigation.js').read_text(),controller)
            return first
    def test_both_quote_styles_and_idempotence(self):
        for quote in ['"',"'"]:
            output=self.build(base.format(script=f'<script type="module" src={quote}./header-navigation.js?v=test{quote}></script>'))
            self.assertNotIn('src=',output)
            self.assertEqual(output.count(helper['MARKER']),1)
            self.assertIn('unchanged header',output)
            self.assertIn('unchanged content',output)
    def test_reversed_markers_fail(self):
        with self.assertRaises(ValueError):self.build(base.format(script=helper['END']+helper['MARKER']))
    def test_duplicate_external_scripts_fail(self):
        with self.assertRaises(ValueError):self.build(base.format(script='<script src="header-navigation.js"></script>'*2))
    def test_unrecognized_external_script_fails(self):
        with self.assertRaises(ValueError):self.build(base.format(script='<script src="https://example.test/header-navigation.js"></script>'))
    def test_unsafe_or_unsupported_source_fails(self):
        for addition in ['\nexport const future=1;', '\nimport x from "x";', '\n// </script>']:
            with self.assertRaises(ValueError):helper['render'](controller+addition)
    def test_missing_main_fails(self):
        with self.assertRaises(ValueError):self.build(base.format(script='').replace('<main id="main">','<main>'))

if __name__=='__main__':unittest.main()
