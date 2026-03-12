"""Tests for scripts/cleanup.py"""
import os
from unittest.mock import patch, MagicMock
from scripts.cleanup import patterns, dirs_to_remove

def test_cleanup_files(tmp_path):
    # Create some dummy files that match patterns
    test_file = tmp_path / "test_123.txt"
    test_file.write_text("dummy")
    log_file = tmp_path / "build.log"
    log_file.write_text("log")
    
    # Mock directories to only include our tmp_path
    with patch("scripts.cleanup.directories", [str(tmp_path)]):
        # We need to re-import or reload to pick up the patch if it's top-level
        # But cleanup.py runs its logic on import/execution. 
        # Let's mock glob.glob and os.remove instead to be safe and thorough.
        with patch("glob.glob") as mock_glob, \
             patch("os.remove") as mock_remove, \
             patch("os.path.exists", return_value=True), \
             patch("shutil.rmtree") as mock_rmtree:
            
            mock_glob.side_effect = lambda p: [p.replace("*", "match")]
            
            # Manually trigger the logic if we were to wrap it in a function, 
            # but cleanup.py is a flat script. We'll mock the print to avoid noise.
            with patch("builtins.print"):
                import importlib
                import scripts.cleanup
                importlib.reload(scripts.cleanup)
                
            assert mock_remove.called
            assert mock_rmtree.called

def test_cleanup_handles_errors():
    with patch("scripts.cleanup.directories", ["/nonexistent/path"]):
        with patch("os.path.exists", return_value=True):
            with patch("glob.glob", return_value=["/path/to/file"]):
                with patch("os.remove", side_effect=Exception("Perm error")):
                    with patch("shutil.rmtree", side_effect=Exception("Dir error")):
                        with patch("builtins.print") as mock_print:
                            import importlib
                            import scripts.cleanup
                            importlib.reload(scripts.cleanup)
                            # Verify error prints were called
                            assert any("Error removing" in str(call) for call in mock_print.call_args_list)
