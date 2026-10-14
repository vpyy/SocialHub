package com.socialhub.user.controller;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.response.ApiResponse;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** GET /api/users/:id */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id), "OK"));
    }

    /** GET /api/users/username/:username */
    @GetMapping("/username/{username}")
    public ResponseEntity<ApiResponse<UserDto>> getByUsername(@PathVariable String username) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserByUsername(username), "OK"));
    }

    /** GET /api/users/search?q=keyword */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserDto>>> search(@RequestParam String q) {
        List<UserDto> results = userService.searchUsers(q);
        return ResponseEntity.ok(ApiResponse.success(results, "OK"));
    }
}
